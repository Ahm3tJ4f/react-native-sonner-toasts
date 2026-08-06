import { useEffect, useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Bell,
  Car,
  CaretUp,
  CheckCircle,
  CloudLightning,
  Coin,
  Copy,
  DownloadSimple,
  Drop,
  Garage,
  GitBranch,
  Lightbulb,
  MapPin,
  MusicNotes,
  Package,
  Pause,
  Play,
  Rocket,
  SkipBack,
  SkipForward,
  Spinner,
  TerminalWindow,
  Thermometer,
  Ticket,
  UploadSimple,
  VideoCamera,
  Warning,
  WifiHigh,
  Wind,
  XCircle,
} from 'phosphor-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { toast, Toaster } from 'react-native-sonner-toasts';

const GREEN = '#16A34A';
const RED = '#DC2626';
const AMBER = '#D97706';
const BLUE = '#2563EB';
const MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

function AnimatedSpinner({ size = 18, color = '#71717A' }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 800, easing: Easing.linear }),
      -1
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Spinner size={size} color={color} />
    </Animated.View>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const OkIcon = <CheckCircle size={18} color={GREEN} weight="fill" />;
const ErrIcon = <XCircle size={18} color={RED} weight="fill" />;


function Avatar({
  initial,
  color,
  size = 44,
}: {
  initial: string;
  color: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>
        {initial}
      </Text>
    </View>
  );
}

function PillButton({
  label,
  icon,
  backgroundColor = '#F4F4F5',
  color = '#171717',
  onPress,
  flex = true,
}: {
  label: string;
  icon?: ReactNode;
  backgroundColor?: string;
  color?: string;
  onPress?: () => void;
  flex?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pillButton,
        { backgroundColor, opacity: pressed ? 0.7 : 1 },
        flex && styles.pillButtonFlex,
      ]}
    >
      {icon}
      <Text style={[styles.pillButtonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function EqBar({ delayMs }: { delayMs: number }) {
  const h = useSharedValue(0.4);
  useEffect(() => {
    h.value = withRepeat(
      withSequence(
        withDelay(
          delayMs,
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) })
        ),
        withDelay(
          delayMs,
          withTiming(0.25, { duration: 400, easing: Easing.inOut(Easing.quad) })
        )
      ),
      -1,
      false
    );
  }, [h, delayMs]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: h.value }] }));
  return <Animated.View style={[styles.eqBar, style]} />;
}

function EqualizerBars() {
  return (
    <View style={styles.eq}>
      {[0, 110, 220, 330, 440].map((d) => (
        <EqBar key={d} delayMs={d} />
      ))}
    </View>
  );
}

function TypingDot({ delayMs }: { delayMs: number }) {
  const o = useSharedValue(0.25);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withDelay(delayMs, withTiming(1, { duration: 350 })),
        withDelay(delayMs, withTiming(0.25, { duration: 350 }))
      ),
      -1,
      false
    );
  }, [o, delayMs]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.typingDot, style]} />;
}

function TransferCard({
  icon,
  title,
  subtitle,
  progress,
  meta,
  color = BLUE,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  progress: number;
  meta?: string;
  color?: string;
}) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <View style={styles.transferCard}>
      <View style={styles.transferRow}>
        <View style={styles.transferIconWrap}>{icon}</View>
        <View style={styles.transferTextWrap}>
          <Text style={styles.transferTitle}>{title}</Text>
          <Text style={styles.transferSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.transferPct}>{Math.round(pct)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%` as `${number}%`, backgroundColor: color },
          ]}
        />
      </View>
      {meta ? (
        <View style={styles.transferMetaRow}>
          <Text style={styles.transferMeta}>
            {pct >= 100 ? 'Finalizing…' : 'Transferring…'}
          </Text>
          <Text style={styles.transferMeta}>{meta}</Text>
        </View>
      ) : null}
    </View>
  );
}


type K8sState = 'degraded' | 'restarting' | 'healthy';

function K8sToast({
  state,
  onRestart,
}: {
  state: K8sState;
  onRestart?: () => void;
}) {
  return (
    <View style={styles.terminalCard}>
      <View style={styles.terminalHeader}>
        <TerminalWindow size={15} color="#8B949E" weight="bold" />
        <Text style={styles.terminalHeaderText}>kubectl get pods -n api</Text>
        <View style={styles.terminalDots}>
          <View style={[styles.termDot, { backgroundColor: '#FF5F57' }]} />
          <View style={[styles.termDot, { backgroundColor: '#FEBC2E' }]} />
          <View style={[styles.termDot, { backgroundColor: '#28C840' }]} />
        </View>
      </View>
      <Text style={styles.termLine}>NAME READY STATUS</Text>
      <Text style={[styles.termLine, { color: '#3FB950' }]}>
        sonner-api-7d8f9b-6k2qr 1/1 Running
      </Text>
      <Text style={[styles.termLine, { color: '#3FB950' }]}>
        sonner-api-7d8f9b-8z1wm 1/1 Running
      </Text>
      {state === 'degraded' && (
        <>
          <Text style={[styles.termLine, { color: '#F85149' }]}>
            sonner-api-7d8f9b-2pv4x 0/1 CrashLoopBackOff
          </Text>
          <View style={styles.termFooter}>
            <Warning size={14} color="#F85149" weight="fill" />
            <Text style={[styles.termFooterText, { color: '#F85149' }]}>
              2 of 3 pods ready
            </Text>
            <PillButton
              label="Restart pod"
              backgroundColor="#F85149"
              color="#FFFFFF"
              flex={false}
              onPress={onRestart}
            />
          </View>
        </>
      )}
      {state === 'restarting' && (
        <>
          <Text style={[styles.termLine, { color: '#D29922' }]}>
            sonner-api-7d8f9b-2pv4x 0/1 Terminating
          </Text>
          <View style={styles.termFooter}>
            <AnimatedSpinner size={14} color="#D29922" />
            <Text style={[styles.termFooterText, { color: '#D29922' }]}>
              restarting pod…
            </Text>
          </View>
        </>
      )}
      {state === 'healthy' && (
        <>
          <Text style={[styles.termLine, { color: '#3FB950' }]}>
            sonner-api-7d8f9b-2pv4x 1/1 Running
          </Text>
          <View style={styles.termFooter}>
            <CheckCircle size={14} color="#3FB950" weight="fill" />
            <Text style={[styles.termFooterText, { color: '#3FB950' }]}>
              3/3 ready · back in service
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const CI_STAGES = ['Lint', 'Test', 'Build', 'Deploy'];

function CiToast({ stage }: { stage: number }) {
  const done = stage >= CI_STAGES.length;
  return (
    <View style={styles.terminalCard}>
      <View style={styles.terminalHeader}>
        <GitBranch size={15} color="#8B949E" weight="bold" />
        <Text style={styles.terminalHeaderText}>sonner-toasts · main</Text>
        <Text style={styles.termCommit}>a1b2c3d</Text>
      </View>
      {CI_STAGES.map((name, i) => {
        const isDone = done || i < stage;
        const isActive = !done && i === stage;
        return (
          <View key={name} style={styles.ciRow}>
            <View style={styles.ciRowLeft}>
              {isDone ? (
                <CheckCircle size={14} color="#3FB950" weight="fill" />
              ) : isActive ? (
                <AnimatedSpinner size={14} color="#58A6FF" />
              ) : (
                <View style={styles.ciDot} />
              )}
              <Text
                style={[
                  styles.ciStage,
                  isActive && styles.ciStageActive,
                  isDone && styles.ciStageDone,
                ]}
              >
                {name}
              </Text>
            </View>
            <Text style={styles.ciTime}>
              {isDone ? `${i + 1}s` : isActive ? 'running…' : 'queued'}
            </Text>
          </View>
        );
      })}
      {done && (
        <View style={styles.ciDone}>
          <Rocket size={14} color="#3FB950" weight="fill" />
          <Text style={styles.ciDoneText}>Deployed to production 🎉</Text>
        </View>
      )}
    </View>
  );
}

function NowPlayingToast({
  playing,
  onToggle,
}: {
  playing: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.mediaCard}>
      <View style={styles.mediaRow}>
        <View style={styles.artwork}>
          <MusicNotes size={24} color="#FFFFFF" weight="bold" />
        </View>
        <View style={styles.mediaInfo}>
          <Text style={styles.mediaTitle}>Midnight City</Text>
          <Text style={styles.mediaArtist}>M83 · Hurry Up, We're Dreaming</Text>
        </View>
        <EqualizerBars />
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '64%' as `${number}%` }]} />
      </View>
      <View style={styles.mediaTimes}>
        <Text style={styles.mediaTime}>2:41</Text>
        <Text style={styles.mediaTime}>4:04</Text>
      </View>
      <View style={styles.mediaControls}>
        <SkipBack size={22} color="#171717" weight="fill" />
        <Pressable onPress={onToggle} style={styles.playButton}>
          {playing ? (
            <Pause size={20} color="#FFFFFF" weight="fill" />
          ) : (
            <Play size={20} color="#FFFFFF" weight="fill" />
          )}
        </Pressable>
        <SkipForward size={22} color="#171717" weight="fill" />
      </View>
    </View>
  );
}

function CryptoTickerToast() {
  const bars = [
    18, 26, 14, 30, 22, 34, 26, 40, 30, 46, 36, 52, 42, 58, 48, 44, 62, 50, 56,
    64,
  ];
  return (
    <View style={styles.cryptoCard}>
      <View style={styles.cryptoHeader}>
        <View style={styles.cryptoCoin}>
          <Coin size={18} color="#F7931A" weight="fill" />
        </View>
        <View style={styles.cryptoPairWrap}>
          <Text style={styles.cryptoPair}>BTC/USD</Text>
          <Text style={styles.cryptoSub}>Coinbase Pro</Text>
        </View>
        <View style={styles.cryptoPriceWrap}>
          <Text style={styles.cryptoPrice}>$67,420.12</Text>
          <View style={styles.cryptoChange}>
            <CaretUp size={12} color={GREEN} weight="bold" />
            <Text style={styles.cryptoChangeText}>+2.41%</Text>
          </View>
        </View>
      </View>
      <View style={styles.sparkRow}>
        {bars.map((h, i) => (
          <View
            key={i}
            style={[
              styles.sparkBar,
              { height: h, backgroundColor: i > 12 ? GREEN : '#86EFAC' },
            ]}
          />
        ))}
      </View>
      <View style={styles.cryptoFooter}>
        <Text style={styles.cryptoMeta}>24h vol $34.2B</Text>
        <Text style={styles.cryptoMeta}>High $68,102</Text>
        <Text style={styles.cryptoMeta}>Low $65,731</Text>
      </View>
    </View>
  );
}

function LiveMatchToast() {
  return (
    <View style={styles.matchCard}>
      <View style={styles.matchTop}>
        <Text style={styles.matchSeries}>IBJJF Pan · Final · Heavyweight</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
      <View style={styles.matchScore}>
        <View style={styles.matchSide}>
          <Avatar initial="A" color={BLUE} size={40} />
          <Text style={styles.matchName}>You</Text>
          <Text style={styles.matchScoreNum}>6</Text>
        </View>
        <View style={styles.matchCenter}>
          <Text style={styles.matchTime}>2:12</Text>
          <Text style={styles.matchRound}>Round 2 · GI</Text>
        </View>
        <View style={styles.matchSide}>
          <Avatar initial="L" color={RED} size={40} />
          <Text style={styles.matchName}>M. Lima</Text>
          <Text style={styles.matchScoreNum}>4</Text>
        </View>
      </View>
      <PillButton
        label="Watch live"
        icon={<VideoCamera size={15} color="#FFFFFF" weight="fill" />}
        backgroundColor={RED}
        color="#FFFFFF"
        onPress={() => console.log('watch match')}
      />
    </View>
  );
}

function MeetingToast({
  onJoin,
  onSnooze,
}: {
  onJoin: () => void;
  onSnooze: () => void;
}) {
  const [seconds, setSeconds] = useState(5 * 60);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const started = seconds === 0;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <View style={styles.meetingCard}>
      <View style={styles.meetingRow}>
        <View style={styles.meetingIconWrap}>
          <VideoCamera size={20} color={BLUE} weight="fill" />
        </View>
        <View style={styles.meetingInfo}>
          <Text style={styles.meetingTitle}>
            Standup starts {started ? 'now' : `in ${mm}:${ss}`}
          </Text>
          <Text style={styles.meetingMeta}>Sonner Team · 4 participants</Text>
        </View>
      </View>
      <View style={styles.meetingActions}>
        <PillButton
          label="Snooze 5m"
          backgroundColor="#F4F4F5"
          color="#525252"
          onPress={onSnooze}
        />
        <PillButton
          label="Join"
          icon={<VideoCamera size={15} color="#FFFFFF" weight="fill" />}
          backgroundColor={BLUE}
          color="#FFFFFF"
          onPress={onJoin}
        />
      </View>
    </View>
  );
}

function DeliveryToast() {
  return (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryRow}>
        <View>
          <Avatar initial="R" color="#7C3AED" size={40} />
          <View style={styles.deliveryBadge}>
            <MapPin size={10} color="#FFFFFF" weight="fill" />
          </View>
        </View>
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryTitle}>Rider is 2 min away</Text>
          <Text style={styles.deliveryMeta}>Order #A4291 · Sushi Mania</Text>
        </View>
        <View style={styles.deliveryEta}>
          <Text style={styles.deliveryEtaTime}>6:42 PM</Text>
          <Text style={styles.deliveryEtaLabel}>ETA</Text>
        </View>
      </View>
      <View style={styles.deliveryFooter}>
        <Package size={14} color="#737373" weight="fill" />
        <Text style={styles.deliveryFooterText}>2 items · paid with card</Text>
        <PillButton
          label="Track"
          backgroundColor="#7C3AED"
          color="#FFFFFF"
          flex={false}
          onPress={() => console.log('track order')}
        />
      </View>
    </View>
  );
}

type GarageState = 'closed' | 'opening' | 'open';

const GARAGE_STATUS: Record<GarageState, { text: string; color: string }> = {
  closed: { text: 'Closed · 2 min ago', color: GREEN },
  opening: { text: 'Opening…', color: AMBER },
  open: { text: 'Open · just now', color: BLUE },
};

function GarageToast({
  state,
  onToggle,
}: {
  state: GarageState;
  onToggle: (state: GarageState) => void;
}) {
  const status = GARAGE_STATUS[state];
  const isOpen = state === 'open';
  return (
    <View style={styles.homeCard}>
      <View style={styles.homeRow}>
        <View style={styles.homeIconWrap}>
          <Garage size={22} color="#171717" weight="fill" />
        </View>
        <View style={styles.homeInfo}>
          <Text style={styles.homeTitle}>Garage door</Text>
          <View style={styles.homeStatusRow}>
            <View style={[styles.homeDot, { backgroundColor: status.color }]} />
            <Text style={[styles.homeStatus, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => onToggle(state)}
          style={[styles.switch, isOpen && styles.switchOn]}
        >
          <View style={[styles.switchKnob, isOpen && styles.switchKnobOn]} />
        </Pressable>
      </View>
      <View style={styles.homeFooter}>
        <View style={styles.homeStat}>
          <Thermometer size={13} color="#737373" weight="fill" />
          <Text style={styles.homeStatText}>19°C</Text>
        </View>
        <View style={styles.homeStat}>
          <Car size={13} color="#737373" weight="fill" />
          <Text style={styles.homeStatText}>No car</Text>
        </View>
        <View style={styles.homeStat}>
          <Lightbulb size={13} color="#737373" weight="fill" />
          <Text style={styles.homeStatText}>Lights off</Text>
        </View>
      </View>
    </View>
  );
}

function TypingToast() {
  return (
    <View style={styles.typingCard}>
      <Avatar initial="D" color="#0EA5E9" size={36} />
      <View style={styles.typingBubble}>
        <Text style={styles.typingName}>Dana</Text>
        <View style={styles.typingRow}>
          <TypingDot delayMs={0} />
          <TypingDot delayMs={160} />
          <TypingDot delayMs={320} />
        </View>
      </View>
    </View>
  );
}

function AirdropToast({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <View style={styles.airdropCard}>
      <View style={styles.airdropRow}>
        <Avatar initial="A" color={BLUE} size={40} />
        <View style={styles.airdropInfo}>
          <Text style={styles.airdropTitle}>Alex wants to send you a file</Text>
          <Text style={styles.airdropMeta}>meetup-photos.zip · 48 MB</Text>
        </View>
        <WifiHigh size={20} color={BLUE} weight="fill" />
      </View>
      <View style={styles.airdropActions}>
        <PillButton
          label="Decline"
          backgroundColor="#F4F4F5"
          color="#525252"
          onPress={onDecline}
        />
        <PillButton
          label="Accept"
          backgroundColor={BLUE}
          color="#FFFFFF"
          onPress={onAccept}
        />
      </View>
    </View>
  );
}

function WeatherToast() {
  return (
    <View style={styles.weatherCard}>
      <View style={styles.weatherHeader}>
        <CloudLightning size={26} color="#FCD34D" weight="fill" />
        <View style={styles.weatherInfo}>
          <Text style={styles.weatherTitle}>Severe thunderstorm warning</Text>
          <Text style={styles.weatherMeta}>
            Valid until 9:00 PM · City Center
          </Text>
        </View>
      </View>
      <View style={styles.weatherRow}>
        <View style={styles.weatherStat}>
          <Drop size={14} color="#93C5FD" weight="fill" />
          <Text style={styles.weatherStatText}>92% rain</Text>
        </View>
        <View style={styles.weatherStat}>
          <Wind size={14} color="#93C5FD" weight="fill" />
          <Text style={styles.weatherStatText}>38 km/h gusts</Text>
        </View>
        <View style={styles.weatherStat}>
          <Thermometer size={14} color="#93C5FD" weight="fill" />
          <Text style={styles.weatherStatText}>17°C</Text>
        </View>
      </View>
    </View>
  );
}

function GitPushToast() {
  return (
    <View style={styles.terminalCard}>
      <View style={styles.terminalHeader}>
        <TerminalWindow size={15} color="#8B949E" weight="bold" />
        <Text style={styles.terminalHeaderText}>git push origin main</Text>
        <View style={styles.terminalDots}>
          <View style={[styles.termDot, { backgroundColor: '#FF5F57' }]} />
          <View style={[styles.termDot, { backgroundColor: '#FEBC2E' }]} />
          <View style={[styles.termDot, { backgroundColor: '#28C840' }]} />
        </View>
      </View>
      <Text style={styles.termLine}>Enumerating objects: 14, done.</Text>
      <Text style={styles.termLine}>
        Writing objects: 100% (14/14), 2.4 KiB.
      </Text>
      <Text style={[styles.termLine, { color: '#3FB950' }]}>
        ✓ main → main (a1b2c3d)
      </Text>
      <Text style={[styles.termLine, { color: '#3FB950' }]}>
        Everything up-to-date · branch deployed
      </Text>
    </View>
  );
}

function CouponToast() {
  return (
    <View style={styles.couponCard}>
      <View style={styles.couponRow}>
        <View style={styles.couponCode}>
          <Text style={styles.couponPct}>20%</Text>
          <Text style={styles.couponOff}>OFF</Text>
        </View>
        <View style={styles.couponInfo}>
          <Text style={styles.couponTitle}>First order discount</Text>
          <Text style={styles.couponMeta}>Code: BJJ20 · expires Nov 30</Text>
        </View>
        <Ticket size={22} color="#EA580C" weight="fill" />
      </View>
      <View style={styles.couponDivider} />
      <View style={styles.couponFooter}>
        <Text style={styles.couponHint}>Tap to copy code</Text>
        <PillButton
          label="Copy code"
          icon={<Copy size={14} color="#FFFFFF" weight="bold" />}
          backgroundColor="#EA580C"
          color="#FFFFFF"
          flex={false}
          onPress={() => console.log('coupon copied')}
        />
      </View>
    </View>
  );
}


const showK8s = () => {
  let id: number;
  id = toast.custom(
    <K8sToast
      state="degraded"
      onRestart={() => {
        toast.custom(<K8sToast state="restarting" />, { id });
        setTimeout(() => {
          toast.custom(<K8sToast state="healthy" />, {
            id,
            duration: 6000,
            dismissible: true,
          });
        }, 2200);
      }}
    />,
    { duration: Infinity, dismissible: false }
  );
};

const showCi = () => {
  let id: number;
  id = toast.custom(<CiToast stage={0} />, {
    duration: Infinity,
    dismissible: false,
  });
  CI_STAGES.forEach((_, i) => {
    setTimeout(
      () => {
        const last = i === CI_STAGES.length - 1;
        toast.custom(
          <CiToast stage={last ? CI_STAGES.length : i + 1} />,
          last
            ? { id, duration: 7000, dismissible: true }
            : { id, duration: Infinity }
        );
      },
      (i + 1) * 900
    );
  });
};

const showNowPlaying = () => {
  let id: number;
  let playing = true;
  const render = () => {
    toast.custom(
      <NowPlayingToast
        playing={playing}
        onToggle={() => {
          playing = !playing;
          render();
        }}
      />,
      { id, duration: Infinity, dismissible: false }
    );
  };
  id = toast.custom(
    <NowPlayingToast
      playing={playing}
      onToggle={() => {
        playing = !playing;
        render();
      }}
    />,
    { duration: Infinity, dismissible: false }
  );
};

const showMeeting = () => {
  let id: number;
  id = toast.custom(
    <MeetingToast
      onJoin={() => {
        toast.dismiss(id);
        toast('Joining standup…', {
          icon: <VideoCamera size={18} color={BLUE} weight="fill" />,
          duration: 3000,
        });
      }}
      onSnooze={() => {
        toast.dismiss(id);
        toast('Snoozed until 10:05', {
          icon: <Bell size={18} color={AMBER} weight="fill" />,
          duration: 3000,
        });
      }}
    />,
    { duration: Infinity, dismissible: false }
  );
};

const showGarage = () => {
  let id: number;
  const onToggle = (current: GarageState) => {
    if (current === 'closed') {
      toast.custom(<GarageToast state="opening" onToggle={onToggle} />, {
        id,
      });
      setTimeout(() => {
        toast.custom(<GarageToast state="open" onToggle={onToggle} />, {
          id,
          duration: 6000,
          dismissible: true,
        });
      }, 1400);
    } else {
      toast.custom(<GarageToast state="closed" onToggle={onToggle} />, {
        id,
        duration: 4000,
        dismissible: true,
      });
    }
  };
  id = toast.custom(<GarageToast state="closed" onToggle={onToggle} />, {
    duration: Infinity,
    dismissible: false,
  });
};

const showAirdrop = () => {
  let id: number;
  id = toast.custom(
    <AirdropToast
      onAccept={() => {
        toast.dismiss(id);
        toast('Downloading meetup-photos.zip…', {
          icon: <DownloadSimple size={18} color={BLUE} weight="bold" />,
          description: '48 MB · AirDrop',
          duration: 4000,
        });
      }}
      onDecline={() => {
        toast.dismiss(id);
        toast('Transfer declined', { icon: ErrIcon, duration: 2500 });
      }}
    />,
    { duration: Infinity, dismissible: false }
  );
};

const runUpload = () => {
  const id = 9008;
  const startedAt = Date.now();
  const totalMs = 3500;
  const TOTAL_MB = 128;
  const failAt =
    Math.random() < 0.4 ? 45 + Math.floor(Math.random() * 35) : null;

  toast.custom(
    <TransferCard
      icon={<UploadSimple size={22} color="#171717" weight="bold" />}
      title="IMG_2041.mov"
      subtitle="0.0 MB of 128 MB"
      progress={0}
    />,
    { id, duration: Infinity, dismissible: false }
  );

  const timer = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));

    if (failAt !== null && pct >= failAt) {
      clearInterval(timer);
      toast.dismiss(id);
      toast('Upload failed', {
        icon: ErrIcon,
        description: 'Connection lost mid-upload',
        duration: 6000,
        closeButton: (
          <Pressable
            onPress={runUpload}
            hitSlop={8}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonLabel}>Retry</Text>
          </Pressable>
        ),
      });
      return;
    }

    const doneMb = (TOTAL_MB * pct) / 100;
    const speed = elapsed > 0 ? doneMb / (elapsed / 1000) : 0;
    const etaSec = speed > 0 ? Math.max(0, (TOTAL_MB - doneMb) / speed) : 0;

    toast.custom(
      <TransferCard
        icon={<UploadSimple size={22} color="#171717" weight="bold" />}
        title="IMG_2041.mov"
        subtitle={`${doneMb.toFixed(1)} MB of ${TOTAL_MB} MB`}
        progress={pct}
        meta={`${speed.toFixed(1)} MB/s · ${Math.ceil(etaSec)}s left`}
      />,
      { id, duration: Infinity }
    );

    if (pct >= 100) {
      clearInterval(timer);
      toast.dismiss(id);
      toast('Upload complete', {
        icon: OkIcon,
        description: 'IMG_2041.mov · 128 MB',
        duration: 5000,
      });
    }
  }, 120);
};

const runDownload = () => {
  const id = 9009;
  const startedAt = Date.now();
  const totalMs = 3000;
  const TOTAL_MB = 14.2;

  toast.custom(
    <TransferCard
      icon={<DownloadSimple size={22} color="#171717" weight="bold" />}
      title="markit-notes.zip"
      subtitle="0.0 MB of 14.2 MB"
      progress={0}
    />,
    { id, duration: Infinity, dismissible: false }
  );

  const timer = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
    const doneMb = (TOTAL_MB * pct) / 100;
    const speed = elapsed > 0 ? doneMb / (elapsed / 1000) : 0;
    const etaSec = speed > 0 ? Math.max(0, (TOTAL_MB - doneMb) / speed) : 0;

    toast.custom(
      <TransferCard
        icon={<DownloadSimple size={22} color="#171717" weight="bold" />}
        title="markit-notes.zip"
        subtitle={`${doneMb.toFixed(1)} MB of ${TOTAL_MB} MB`}
        progress={pct}
        meta={`${speed.toFixed(1)} MB/s · ${Math.ceil(etaSec)}s left`}
      />,
      { id, duration: Infinity }
    );
    if (pct >= 100) {
      clearInterval(timer);
      toast.dismiss(id);
      toast('Ready offline', {
        icon: OkIcon,
        description: 'markit-notes.zip · 14.2 MB',
        duration: 5000,
      });
    }
  }, 120);
};

const showCommandPill = () => {
  toast.custom(
    <View style={styles.commandPill}>
      <Copy size={16} color="#FFFFFF" weight="bold" />
      <Text style={styles.commandPillText}>git push origin main · copied</Text>
    </View>,
    { duration: 2500, styles: { toastContainer: { alignItems: 'center' } } }
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppScreen />
    </SafeAreaProvider>
  );
}

function AppScreen() {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Button label="Dismiss all toasts" onPress={() => toast.dismiss()} />

        <Button
          label="Now playing (equalizer + play/pause)"
          onPress={showNowPlaying}
        />
        <Button label="k8s: pod CrashLoopBackOff → restart" onPress={showK8s} />
        <Button label="CI pipeline: deploy in stages" onPress={showCi} />
        <Button
          label="Crypto ticker"
          onPress={() =>
            toast.custom(<CryptoTickerToast />, { duration: 8000 })
          }
        />
        <Button
          label="Live BJJ match score"
          onPress={() => toast.custom(<LiveMatchToast />, { duration: 10000 })}
        />
        <Button label="Meeting countdown (live)" onPress={showMeeting} />
        <Button
          label="Delivery rider ETA"
          onPress={() => toast.custom(<DeliveryToast />, { duration: 10000 })}
        />
        <Button label="Smart home: garage door" onPress={showGarage} />
        <Button
          label="Typing indicator"
          onPress={() => toast.custom(<TypingToast />, { duration: 6000 })}
        />
        <Button label="AirDrop file transfer" onPress={showAirdrop} />
        <Button
          label="Severe weather alert"
          onPress={() => toast.custom(<WeatherToast />, { duration: 10000 })}
        />
        <Button
          label="git push output"
          onPress={() => toast.custom(<GitPushToast />, { duration: 7000 })}
        />
        <Button
          label="Coupon ticket"
          onPress={() => toast.custom(<CouponToast />, { duration: 8000 })}
        />
        <Button
          label="File upload (progress + speed + ETA)"
          onPress={runUpload}
        />
        <Button label="Download for offline (progress)" onPress={runDownload} />
        <Button label="Command copied (pill)" onPress={showCommandPill} />
      </ScrollView>
      <Toaster position="top" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 24,
    gap: 12,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F4F4F5',
    marginLeft: 4,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#171717',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  pillButtonFlex: {
    flex: 1,
  },
  pillButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  eq: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 22,
  },
  eqBar: {
    width: 3,
    height: 22,
    borderRadius: 1.5,
    backgroundColor: '#7C3AED',
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#9CA3AF',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: BLUE,
  },
  transferCard: {
    padding: 16,
    gap: 12,
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transferIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferTextWrap: {
    flex: 1,
  },
  transferTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
  },
  transferSubtitle: {
    fontSize: 12,
    color: '#737373',
    marginTop: 1,
  },
  transferPct: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
  },
  transferMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transferMeta: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  terminalCard: {
    backgroundColor: '#0D1117',
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  terminalHeaderText: {
    flex: 1,
    color: '#8B949E',
    fontSize: 12,
    fontFamily: MONO,
  },
  termCommit: {
    color: '#58A6FF',
    fontSize: 11,
    fontFamily: MONO,
  },
  terminalDots: {
    flexDirection: 'row',
    gap: 6,
  },
  termDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  termLine: {
    color: '#8B949E',
    fontSize: 11,
    fontFamily: MONO,
  },
  termFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  termFooterText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  ciRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ciRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ciDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#21262D',
  },
  ciStage: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '600',
  },
  ciStageActive: {
    color: '#58A6FF',
  },
  ciStageDone: {
    color: '#3FB950',
  },
  ciTime: {
    color: '#8B949E',
    fontSize: 11,
  },
  ciDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  ciDoneText: {
    color: '#3FB950',
    fontSize: 12,
    fontWeight: '700',
  },
  mediaCard: {
    padding: 16,
    gap: 10,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaInfo: {
    flex: 1,
  },
  mediaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },
  mediaArtist: {
    fontSize: 12,
    color: '#737373',
    marginTop: 1,
  },
  mediaTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediaTime: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  mediaControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cryptoCard: {
    padding: 16,
    gap: 12,
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cryptoCoin: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(247,147,26,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cryptoPairWrap: {
    flex: 1,
  },
  cryptoPair: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },
  cryptoSub: {
    fontSize: 12,
    color: '#737373',
    marginTop: 1,
  },
  cryptoPriceWrap: {
    alignItems: 'flex-end',
  },
  cryptoPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },
  cryptoChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cryptoChangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: GREEN,
  },
  sparkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 64,
  },
  sparkBar: {
    flex: 1,
    borderRadius: 2,
  },
  cryptoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cryptoMeta: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  matchCard: {
    padding: 16,
    gap: 14,
  },
  matchTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchSeries: {
    fontSize: 11,
    fontWeight: '600',
    color: '#737373',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(220,38,38,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: RED,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: RED,
    letterSpacing: 0.5,
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchSide: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  matchName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#525252',
  },
  matchScoreNum: {
    fontSize: 28,
    fontWeight: '800',
    color: '#171717',
  },
  matchCenter: {
    alignItems: 'center',
    gap: 2,
  },
  matchTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
  },
  matchRound: {
    fontSize: 10,
    color: '#A1A1AA',
  },
  meetingCard: {
    padding: 16,
    gap: 12,
  },
  meetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meetingIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(37,99,235,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },
  meetingMeta: {
    fontSize: 12,
    color: '#737373',
    marginTop: 1,
  },
  meetingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  deliveryCard: {
    padding: 16,
    gap: 12,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deliveryBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },
  deliveryMeta: {
    fontSize: 12,
    color: '#737373',
    marginTop: 1,
  },
  deliveryEta: {
    alignItems: 'flex-end',
  },
  deliveryEtaTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
  },
  deliveryEtaLabel: {
    fontSize: 10,
    color: '#A1A1AA',
  },
  deliveryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  deliveryFooterText: {
    flex: 1,
    fontSize: 11,
    color: '#737373',
  },
  homeCard: {
    padding: 16,
    gap: 12,
  },
  homeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  homeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeInfo: {
    flex: 1,
  },
  homeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },
  homeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  homeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  homeStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  switch: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E4E4E7',
    padding: 3,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: BLUE,
  },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  switchKnobOn: {
    transform: [{ translateX: 18 }],
  },
  homeFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  homeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  homeStatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#525252',
  },
  typingCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typingBubble: {
    backgroundColor: '#F4F4F5',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
  typingName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  typingRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  airdropCard: {
    padding: 16,
    gap: 12,
  },
  airdropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  airdropInfo: {
    flex: 1,
  },
  airdropTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
  },
  airdropMeta: {
    fontSize: 12,
    color: '#737373',
    marginTop: 1,
  },
  airdropActions: {
    flexDirection: 'row',
    gap: 10,
  },
  weatherCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weatherMeta: {
    fontSize: 12,
    color: '#BFDBFE',
    marginTop: 1,
  },
  weatherRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  weatherStatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DBEAFE',
  },
  couponCard: {
    padding: 16,
    gap: 12,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponCode: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  couponPct: {
    fontSize: 20,
    fontWeight: '800',
    color: '#EA580C',
  },
  couponOff: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#EA580C',
  },
  couponInfo: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
  },
  couponMeta: {
    fontSize: 12,
    color: '#737373',
    marginTop: 1,
  },
  couponDivider: {
    borderStyle: 'dashed',
    borderTopWidth: 1,
    borderColor: '#E4E4E7',
  },
  couponFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponHint: {
    flex: 1,
    fontSize: 11,
    color: '#A1A1AA',
  },
  commandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#18181B',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignSelf: 'center',
  },
  commandPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: MONO,
  },
});
