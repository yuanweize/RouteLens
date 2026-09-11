package prober

import (
	"fmt"
	"net"
	"os"
	"time"

	"golang.org/x/net/icmp"
	"golang.org/x/net/ipv4"
	"golang.org/x/net/ipv6"
)

type ICMPPinger struct {
	Target     string
	Count      int
	Interval   time.Duration
	Timeout    time.Duration
	Privileged bool // Set to true if running as root/sudo
}

func NewICMPPinger(target string, count int) *ICMPPinger {
	return &ICMPPinger{
		Target:     target,
		Count:      count,
		Interval:   time.Second,
		Timeout:    2 * time.Second,
		Privileged: os.Geteuid() == 0,
	}
}

func (p *ICMPPinger) Run() (*PingResult, error) {
	dst, err := net.ResolveIPAddr("ip", p.Target)
	if err != nil {
		return nil, err
	}

	isIPv4 := dst.IP.To4() != nil
	network := "udp4"
	listenAddr := "0.0.0.0"
	if !isIPv4 {
		network = "udp6"
		listenAddr = "::"
	}
	if p.Privileged {
		if isIPv4 {
			network = "ip4:icmp"
		} else {
			network = "ip6:ipv6-icmp"
		}
	}

	c, err := icmp.ListenPacket(network, listenAddr)
	if err != nil {
		// Fallback suggestion in error
		return nil, fmt.Errorf("listen packet failed (privileged=%v, network=%s): %w", p.Privileged, network, err)
	}
	defer c.Close()

	var rtts []time.Duration
	var sent, recv int

	// Loop for Count
	for i := 0; i < p.Count; i++ {
		sent++
		rtt, err := p.sendPing(c, dst, isIPv4, i+1)

		if err == nil {
			recv++
			rtts = append(rtts, rtt)
		}

		if i < p.Count-1 {
			time.Sleep(p.Interval)
		}
	}

	return p.calculateStats(sent, recv, rtts), nil
}

func (p *ICMPPinger) sendPing(c *icmp.PacketConn, dst *net.IPAddr, isIPv4 bool, seq int) (time.Duration, error) {
	var msgType icmp.Type = ipv4.ICMPTypeEcho
	if !isIPv4 {
		msgType = ipv6.ICMPTypeEchoRequest
	}

	wm := icmp.Message{
		Type: msgType, Code: 0,
		Body: &icmp.Echo{
			ID: os.Getpid() & 0xffff, Seq: seq,
			Data: []byte("RouteLens-Ping"),
		},
	}
	wb, err := wm.Marshal(nil)
	if err != nil {
		return 0, err
	}

	start := time.Now()

	// Send
	if p.Privileged {
		if _, err := c.WriteTo(wb, dst); err != nil {
			return 0, err
		}
	} else {
		// For unprivileged usage (UDP), dst must be UDP address
		udpDst := &net.UDPAddr{IP: dst.IP, Zone: dst.Zone}
		if _, err := c.WriteTo(wb, udpDst); err != nil {
			return 0, err
		}
	}

	// Wait for reply
	reply := make([]byte, 1500)
	err = c.SetReadDeadline(time.Now().Add(p.Timeout))
	if err != nil {
		return 0, err
	}

	n, _, err := c.ReadFrom(reply)
	if err != nil {
		return 0, err
	}

	duration := time.Since(start)

	// Protocol number for ICMP parsing
	protoNum := ipv4.ICMPTypeEchoReply.Protocol()
	if !isIPv4 {
		protoNum = 58 // IPv6-ICMP
	}

	rm, err := icmp.ParseMessage(protoNum, reply[:n])
	if err != nil {
		return 0, err
	}

	switch rm.Type {
	case ipv4.ICMPTypeEchoReply, ipv6.ICMPTypeEchoReply:
		return duration, nil
	default:
		return 0, fmt.Errorf("got non-echo reply: %+v", rm)
	}
}

func (p *ICMPPinger) calculateStats(sent, recv int, rtts []time.Duration) *PingResult {
	res := &PingResult{
		PacketsSent: sent,
		PacketsRecv: recv,
		Timestamp:   time.Now(),
		MinRtt:      0,
		MaxRtt:      0,
		AvgRtt:      0,
	}

	if sent > 0 {
		res.LossRate = float64(sent-recv) / float64(sent) * 100.0
	}

	if len(rtts) > 0 {
		var total time.Duration
		min := rtts[0]
		max := rtts[0]

		for _, rtt := range rtts {
			if rtt < min {
				min = rtt
			}
			if rtt > max {
				max = rtt
			}
			total += rtt
		}

		res.MinRtt = min
		res.MaxRtt = max
		res.AvgRtt = total / time.Duration(len(rtts))
	}

	return res
}
