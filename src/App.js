import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  ShieldCheck,
  Store,
  Timer,
  Truck,
  Lock,
  Phone,
  MapPin,
  Loader2
} from "lucide-react";
import "./style.css";

/**
 * StackBlitz friendly front end (no shadcn).
 * Screens:
 * Landing → Auth → Destination → Merchants → Merchant Detail → Tracking → Unlock
 */

// Mock data
const LOCATIONS = [
  {
    id: "vp-launch-fishers",
    name: "Launch Fishers",
    subtitle: "Shared pickup",
    arrivePoints: [
      { id: "AP-101", label: "AP-101 • Lobby", type: "shared" },
      { id: "AP-102", label: "AP-102 • Suite Wing", type: "shared" }
    ]
  },
  {
    id: "vp-building-a",
    name: "Visionary Park Building A",
    subtitle: "Private pickup",
    arrivePoints: [{ id: "AP-201", label: "AP-201 • Main Entrance", type: "private" }]
  },
  {
    id: "vp-building-b",
    name: "Visionary Park Building B",
    subtitle: "Private pickup",
    arrivePoints: [{ id: "AP-301", label: "AP-301 • Mail Room", type: "private" }]
  }
];

const MERCHANTS = [
  {
    id: "merchant-1",
    name: "Sushi & Bowls",
    category: "Asian",
    etaMins: 28,
    open: true,
    chownowUrl: "https://order.chownow.com/placeholders/merchant-1",
    tags: ["Fresh", "Light", "Popular"]
  },
  {
    id: "merchant-2",
    name: "Garlic Noodle House",
    category: "Noodles",
    etaMins: 32,
    open: true,
    chownowUrl: "https://order.chownow.com/placeholders/merchant-2",
    tags: ["Savory", "Medium spice"]
  },
  {
    id: "merchant-3",
    name: "Grill & Greens",
    category: "Bowls",
    etaMins: 24,
    open: false,
    chownowUrl: "https://order.chownow.com/placeholders/merchant-3",
    tags: ["Protein", "Clean"]
  }
];

const WINDOWS = [
  { id: "lunch", label: "Lunch Window", hours: "11:00 AM to 2:00 PM" },
  { id: "dinner", label: "Dinner Window", hours: "5:00 PM to 9:00 PM" }
];

const SCREENS = {
  LANDING: "LANDING",
  AUTH: "AUTH",
  DESTINATION: "DESTINATION",
  MERCHANTS: "MERCHANTS",
  MERCHANT_DETAIL: "MERCHANT_DETAIL",
  TRACKING: "TRACKING",
  UNLOCK: "UNLOCK"
};

function formatPhone(raw) {
  const digits = (raw || "").replace(/\D/g, "").slice(0, 10);
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6, 10);
  if (digits.length <= 3) return a;
  if (digits.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

function nowPlusMinutes(mins) {
  const d = new Date(Date.now() + mins * 60 * 1000);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Pill({ children }) {
  return <span className="pill">{children}</span>;
}

function Card({ title, children }) {
  return (
    <div className="card">
      {title ? <div className="cardTitle">{title}</div> : null}
      <div className="cardBody">{children}</div>
    </div>
  );
}

function Button({ children, onClick, variant = "primary", disabled, full, icon }) {
  return (
    <button
      className={[
        "btn",
        variant === "outline" ? "btnOutline" : "btnPrimary",
        full ? "btnFull" : ""
      ].join(" ")}
      onClick={onClick}
      disabled={disabled}
    >
      {icon ? <span className="btnIcon">{icon}</span> : null}
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, inputMode, readOnly }) {
  return (
    <input
      className="input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      inputMode={inputMode}
      readOnly={readOnly}
    />
  );
}

function Row({ icon, title, desc }) {
  return (
    <div className="row">
      <div className="rowIcon">{icon}</div>
      <div>
        <div className="rowTitle">{title}</div>
        <div className="rowDesc">{desc}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [user, setUser] = useState(null); // { phone }
  const [locationId, setLocationId] = useState("");
  const [arrivePointId, setArrivePointId] = useState("");
  const [selectedMerchantId, setSelectedMerchantId] = useState(null);
  const [order, setOrder] = useState(null);
  const [showHow, setShowHow] = useState(false);

  // Read QR deep link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loc = params.get("location");
    if (loc) setLocationId(loc);
  }, []);

  const location = useMemo(
    () => LOCATIONS.find((l) => l.id === locationId) || null,
    [locationId]
  );

  const arrivePoint = useMemo(() => {
    if (!location) return null;
    return location.arrivePoints.find((ap) => ap.id === arrivePointId) || null;
  }, [location, arrivePointId]);

  const deliveryContext = useMemo(() => {
    if (!location || !arrivePoint) return null;
    return {
      locationName: location.name,
      arrivePointId: arrivePoint.id,
      arrivePointLabel: arrivePoint.label
    };
  }, [location, arrivePoint]);

  const selectedMerchant = useMemo(
    () => MERCHANTS.find((m) => m.id === selectedMerchantId) || null,
    [selectedMerchantId]
  );

  // Mock order status progression
  useEffect(() => {
    if (!order) return;
    if (order.status === "DELIVERED") return;

    const timers = [];
    const advance = (next, ms) => {
      timers.push(setTimeout(() => setOrder((o) => ({ ...o, status: next })), ms));
    };

    if (order.status === "PLACED") advance("ACCEPTED", 1500);
    if (order.status === "ACCEPTED") advance("PREPARING", 1800);
    if (order.status === "PREPARING") advance("READY", 2600);
    if (order.status === "READY") advance("PICKED_UP", 1800);
    if (order.status === "PICKED_UP") advance("IN_FLIGHT", 1800);
    if (order.status === "IN_FLIGHT") advance("DELIVERED", 2800);

    return () => timers.forEach(clearTimeout);
  }, [order?.status]);

  // Simple guardrails
  useEffect(() => {
    if (screen === SCREENS.LANDING) return;

    if (!user && screen !== SCREENS.AUTH) setScreen(SCREENS.AUTH);
    if (user && (!locationId || !arrivePointId) && screen !== SCREENS.DESTINATION && screen !== SCREENS.AUTH) {
      setScreen(SCREENS.DESTINATION);
    }
  }, [screen, user, locationId, arrivePointId]);

  return (
    <div className="page">
      <div className="wrap">
        <div className="topbar">
          <div className="brand">
            <div className="logoBox">
              <QrCode size={18} />
            </div>
            <div>
              <div className="brandTitle">Drone Delivery</div>
              <div className="brandSub">Order from nearby merchants, delivered to your Arrive Point</div>
            </div>
          </div>

          <div className="topRight">
            <div className="pills">
              <Pill>Visionary Park</Pill>
              {deliveryContext ? (
                <Pill>
                  <MapPin size={14} style={{ marginRight: 6 }} />
                  {deliveryContext.arrivePointId}
                </Pill>
              ) : null}
              {user?.phone ? (
                <Pill>
                  <Phone size={14} style={{ marginRight: 6 }} />
                  {formatPhone(user.phone)}
                </Pill>
              ) : null}
            </div>

            <Button variant="outline" onClick={() => setShowHow(true)}>
              How it works
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {screen === SCREENS.LANDING && (
            <motion.div key="landing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Landing onContinue={() => setScreen(SCREENS.AUTH)} />
            </motion.div>
          )}

          {screen === SCREENS.AUTH && (
            <motion.div key="auth" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Auth
                onAuthed={(u) => {
                  setUser(u);
                  setScreen(SCREENS.DESTINATION);
                }}
              />
            </motion.div>
          )}

          {screen === SCREENS.DESTINATION && (
            <motion.div key="dest" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Destination
                locationId={locationId}
                arrivePointId={arrivePointId}
                onPickLocation={(id) => {
                  setLocationId(id);
                  setArrivePointId("");
                }}
                onPickArrivePoint={(id) => setArrivePointId(id)}
                onContinue={() => setScreen(SCREENS.MERCHANTS)}
              />
            </motion.div>
          )}

          {screen === SCREENS.MERCHANTS && (
            <motion.div key="merchants" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Merchants
                deliveryContext={deliveryContext}
                onSelect={(id) => {
                  setSelectedMerchantId(id);
                  setScreen(SCREENS.MERCHANT_DETAIL);
                }}
              />
            </motion.div>
          )}

          {screen === SCREENS.MERCHANT_DETAIL && selectedMerchant && (
            <motion.div key="detail" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <MerchantDetail
                merchant={selectedMerchant}
                deliveryContext={deliveryContext}
                onBack={() => setScreen(SCREENS.MERCHANTS)}
                onCheckout={() => {
                  window.open(selectedMerchant.chownowUrl, "_blank", "noopener,noreferrer");
                  const newOrder = {
                    id: `VP-${Math.floor(Math.random() * 90000) + 10000}`,
                    status: "PLACED",
                    merchantName: selectedMerchant.name,
                    eta: selectedMerchant.etaMins
                  };
                  setOrder(newOrder);
                  setScreen(SCREENS.TRACKING);
                }}
              />
            </motion.div>
          )}

          {screen === SCREENS.TRACKING && order && (
            <motion.div key="tracking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Tracking
                order={order}
                deliveryContext={deliveryContext}
                onBack={() => setScreen(SCREENS.MERCHANTS)}
                onUnlock={() => setScreen(SCREENS.UNLOCK)}
              />
            </motion.div>
          )}

          {screen === SCREENS.UNLOCK && order && (
            <motion.div key="unlock" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Unlock order={order} deliveryContext={deliveryContext} onDone={() => setScreen(SCREENS.MERCHANTS)} />
            </motion.div>
          )}
        </AnimatePresence>

        {showHow ? (
          <div className="modalBackdrop" onClick={() => setShowHow(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modalTitle">How it works</div>
              <div className="modalSub">QR → web app → ChowNow → delivery → pickup</div>
              <div className="modalBody">
                <Row icon={<QrCode size={18} />} title="Scan a QR code" desc="Open the ordering hub in your browser. No app install." />
                <Row icon={<MapPin size={18} />} title="Confirm your Arrive Point" desc="We route delivery and secure pickup based on your destination." />
                <Row icon={<Store size={18} />} title="Order in ChowNow" desc="Restaurants keep their normal checkout and payment flow." />
                <Row icon={<Lock size={18} />} title="Track and pick up" desc="Get updates, then open the Arrive Point when delivered." />
              </div>
              <div className="modalFooter">
                <Button onClick={() => setShowHow(false)} full>
                  Got it
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Landing({ onContinue }) {
  return (
    <div className="grid">
      <Card title="Order from nearby merchants">
        <div className="notice">
          <ShieldCheck size={18} />
          <div>
            <div className="noticeTitle">Secure pickup</div>
            <div className="noticeDesc">Delivery is routed to your Arrive Point and access is controlled here.</div>
          </div>
        </div>

        <div className="twoCol">
          <div className="mini">
            <div className="miniTop">
              <div className="miniIcon"><Store size={16} /></div>
              <div className="miniTitle">Restaurant friendly</div>
            </div>
            <div className="miniDesc">Ordering stays in ChowNow. No new POS training.</div>
          </div>

          <div className="mini">
            <div className="miniTop">
              <div className="miniIcon"><Truck size={16} /></div>
              <div className="miniTitle">Runner or drone</div>
            </div>
            <div className="miniDesc">We handle pickup, staging, and delivery to your Arrive Point.</div>
          </div>

          <div className="mini">
            <div className="miniTop">
              <div className="miniIcon"><Timer size={16} /></div>
              <div className="miniTitle">Live updates</div>
            </div>
            <div className="miniDesc">Track from order placed to delivered.</div>
          </div>

          <div className="mini">
            <div className="miniTop">
              <div className="miniIcon"><Lock size={16} /></div>
              <div className="miniTitle">One tap unlock</div>
            </div>
            <div className="miniDesc">Open the Arrive Point when your order arrives.</div>
          </div>
        </div>

        <Button full onClick={onContinue}>
          Continue
        </Button>
      </Card>

      <Card title="Delivery windows">
        {WINDOWS.map((w) => (
          <div className="listItem" key={w.id}>
            <div>
              <div className="listTitle">{w.label}</div>
              <div className="listSub">{w.hours}</div>
            </div>
            <Pill>Active</Pill>
          </div>
        ))}
        <div className="muted" style={{ marginTop: 10 }}>
          Times are estimates and may vary with pickup and flight conditions.
        </div>
      </Card>
    </div>
  );
}

function Auth({ onAuthed }) {
  const [step, setStep] = useState("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const canSend = phone.replace(/\D/g, "").length === 10;
  const canVerify = otp.replace(/\D/g, "").length === 6;

  async function send() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setStep("OTP");
  }

  async function verify() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    onAuthed({ phone: phone.replace(/\D/g, "") });
  }

  return (
    <div className="grid">
      <Card title="Sign in">
        {step === "PHONE" ? (
          <>
            <div className="field">
              <div className="label">Mobile number</div>
              <Input
                value={formatPhone(phone)}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(317) 555-0123"
                inputMode="tel"
              />
              <div className="hint">We will send a one-time code to verify your number.</div>
            </div>
            <Button full disabled={!canSend || loading} onClick={send} icon={loading ? <Loader2 size={16} className="spin" /> : null}>
              Send code
            </Button>
          </>
        ) : (
          <>
            <div className="field">
              <div className="label">Enter code</div>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                inputMode="numeric"
              />
              <div className="hint">Demo: any 6 digits will verify.</div>
            </div>
            <div className="btnRow">
              <Button variant="outline" onClick={() => setStep("PHONE")}>Back</Button>
              <Button disabled={!canVerify || loading} onClick={verify} icon={loading ? <Loader2 size={16} className="spin" /> : null}>
                Verify
              </Button>
            </div>
          </>
        )}
      </Card>

      <Card title="Why we verify">
        <div className="mini">
          <div className="miniTop">
            <div className="miniIcon"><ShieldCheck size={16} /></div>
            <div className="miniTitle">Secure access</div>
          </div>
          <div className="miniDesc">Protects Arrive Point access and delivery notifications.</div>
        </div>
        <div className="mini" style={{ marginTop: 10 }}>
          <div className="miniTop">
            <div className="miniIcon"><Timer size={16} /></div>
            <div className="miniTitle">Less friction</div>
          </div>
          <div className="miniDesc">OTP sign in is quick and works on any phone.</div>
        </div>
      </Card>
    </div>
  );
}

function Destination({ locationId, arrivePointId, onPickLocation, onPickArrivePoint, onContinue }) {
  const location = LOCATIONS.find((l) => l.id === locationId) || null;
  const canContinue = Boolean(locationId && arrivePointId);

  return (
    <div className="grid">
      <Card title="Confirm your delivery destination">
        <div className="label">Location</div>
        <div className="stack">
          {LOCATIONS.map((l) => (
            <button
              key={l.id}
              className={"select " + (l.id === locationId ? "selectOn" : "")}
              onClick={() => onPickLocation(l.id)}
            >
              <div>
                <div className="selectTitle">{l.name}</div>
                <div className="selectSub">{l.subtitle}</div>
              </div>
              <Pill>{l.id === locationId ? "Selected" : "Select"}</Pill>
            </button>
          ))}
        </div>

        <div className="sep" />

        <div className="label">Arrive Point</div>
        {!location ? (
          <div className="muted">Select a location to see available Arrive Points.</div>
        ) : (
          <div className="stack">
            {location.arrivePoints.map((ap) => (
              <button
                key={ap.id}
                className={"select " + (ap.id === arrivePointId ? "selectOn" : "")}
                onClick={() => onPickArrivePoint(ap.id)}
              >
                <div>
                  <div className="selectTitle">{ap.label}</div>
                  <div className="selectSub">{ap.type === "shared" ? "Shared access rules may apply" : "Private delivery destination"}</div>
                </div>
                <Pill>{ap.id === arrivePointId ? "Selected" : "Select"}</Pill>
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <Button full disabled={!canContinue} onClick={onContinue}>
            Continue to merchants
          </Button>
        </div>
      </Card>

      <Card title="What happens next">
        <Row icon={<Store size={18} />} title="Order through ChowNow" desc="Restaurants keep checkout and payment flow." />
        <Row icon={<Truck size={18} />} title="Pickup and staging" desc="Runner or robot moves order to drone launch." />
        <Row icon={<ShieldCheck size={18} />} title="Delivery to Arrive Point" desc="You get notified when pickup is ready." />
      </Card>
    </div>
  );
}

function Merchants({ deliveryContext, onSelect }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return MERCHANTS;
    return MERCHANTS.filter((m) => m.name.toLowerCase().includes(s) || m.category.toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="grid">
      <Card title="Choose a merchant">
        {deliveryContext ? (
          <div className="pills" style={{ marginBottom: 10 }}>
            <Pill><MapPin size={14} style={{ marginRight: 6 }} />{deliveryContext.locationName}</Pill>
            <Pill><ShieldCheck size={14} style={{ marginRight: 6 }} />{deliveryContext.arrivePointLabel}</Pill>
          </div>
        ) : null}

        <div className="field">
          <div className="label">Search</div>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search merchants" />
        </div>

        <div className="stack">
          {filtered.map((m) => (
            <button
              key={m.id}
              className={"merchant " + (!m.open ? "merchantOff" : "")}
              disabled={!m.open}
              onClick={() => onSelect(m.id)}
            >
              <div>
                <div className="merchantTop">
                  <div className="merchantName">{m.name}</div>
                  <Pill>{m.open ? "Open" : "Closed"}</Pill>
                </div>
                <div className="merchantSub">{m.category}</div>
                <div className="tagRow">
                  {m.tags.map((t) => (
                    <span className="tag" key={t}>{t}</span>
                  ))}
                </div>
              </div>

              <div className="eta">
                <div className="etaLabel">Est. delivery</div>
                <div className="etaValue">{m.etaMins} min</div>
                <div className="etaSmall">Arrives ~{nowPlusMinutes(m.etaMins)}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Today’s windows">
        {WINDOWS.map((w) => (
          <div className="listItem" key={w.id}>
            <div>
              <div className="listTitle">{w.label}</div>
              <div className="listSub">{w.hours}</div>
            </div>
          </div>
        ))}
        <div className="muted" style={{ marginTop: 10 }}>
          Merchants may pause drone delivery due to weather or capacity.
        </div>
      </Card>
    </div>
  );
}

function MerchantDetail({ merchant, deliveryContext, onBack, onCheckout }) {
  const note = deliveryContext ? `Visionary Park drone delivery to ${deliveryContext.arrivePointId}` : "";

  return (
    <div className="grid">
      <Card title={merchant.name}>
        <div className="pills" style={{ marginBottom: 10 }}>
          <Pill>{merchant.category}</Pill>
          <Pill><Timer size={14} style={{ marginRight: 6 }} />{merchant.etaMins} min</Pill>
        </div>

        <div className="muted">
          Checkout and payment happens in ChowNow. After checkout, come back here for tracking and pickup.
        </div>

        {deliveryContext ? (
          <div className="notice" style={{ marginTop: 12 }}>
            <MapPin size={18} />
            <div>
              <div className="noticeTitle">Delivery destination</div>
              <div className="noticeDesc">{deliveryContext.arrivePointLabel} ({deliveryContext.arrivePointId})</div>
            </div>
          </div>
        ) : null}

        <div className="sep" />

        <div className="label">Suggested order note (placeholder)</div>
        <Input value={note} readOnly />

        <div className="btnRow" style={{ marginTop: 12 }}>
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onCheckout} icon={<Store size={16} />}>Order with ChowNow</Button>
        </div>

        <div className="hint" style={{ marginTop: 10 }}>
          Demo: opens the ChowNow link in a new tab and creates a mock order.
        </div>
      </Card>
    </div>
  );
}

function Tracking({ order, deliveryContext, onBack, onUnlock }) {
  const steps = [
    { key: "PLACED", label: "Order placed" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "PREPARING", label: "Preparing" },
    { key: "READY", label: "Ready for pickup" },
    { key: "PICKED_UP", label: "Picked up" },
    { key: "IN_FLIGHT", label: "In flight" },
    { key: "DELIVERED", label: "Delivered" }
  ];
  const idx = steps.findIndex((s) => s.key === order.status);
  const canUnlock = order.status === "DELIVERED";

  return (
    <div className="grid">
      <Card title="Tracking">
        <div className="pills" style={{ marginBottom: 10 }}>
          <Pill>Order {order.id}</Pill>
          <Pill>{order.merchantName}</Pill>
          {deliveryContext?.arrivePointId ? (
            <Pill><MapPin size={14} style={{ marginRight: 6 }} />{deliveryContext.arrivePointId}</Pill>
          ) : null}
          <Pill>ETA ~{nowPlusMinutes(order.eta)}</Pill>
        </div>

        <div className="statusBox">
          <div className="statusBig">{steps[idx]?.label || order.status}</div>
          <div className="statusSteps">
            {steps.map((s, i) => (
              <div key={s.key} className={"step " + (i <= idx ? "stepOn" : "")}>
                <div className="dot" />
                <div className="stepLabel">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {canUnlock ? (
          <div className="notice" style={{ marginTop: 12 }}>
            <Lock size={18} />
            <div>
              <div className="noticeTitle">Your order has arrived</div>
              <div className="noticeDesc">Open the Arrive Point to retrieve your order.</div>
            </div>
          </div>
        ) : (
          <div className="hint" style={{ marginTop: 12 }}>Demo: status updates advance automatically.</div>
        )}

        <div className="btnRow" style={{ marginTop: 12 }}>
          <Button variant="outline" onClick={onBack}>Back to merchants</Button>
          <Button disabled={!canUnlock} onClick={onUnlock} icon={<Lock size={16} />}>Open Arrive Point</Button>
        </div>
      </Card>
    </div>
  );
}

function Unlock({ order, deliveryContext, onDone }) {
  const [mode, setMode] = useState("QR");
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [otp, setOtp] = useState("");

  async function doUnlock() {
    setUnlocking(true);
    await new Promise((r) => setTimeout(r, 900));
    setUnlocking(false);
    setUnlocked(true);
  }

  return (
    <div className="grid">
      <Card title="Open Arrive Point">
        <div className="tabs">
          <button className={"tab " + (mode === "QR" ? "tabOn" : "")} onClick={() => setMode("QR")}>QR</button>
          <button className={"tab " + (mode === "OTP" ? "tabOn" : "")} onClick={() => setMode("OTP")}>OTP</button>
        </div>

        {mode === "QR" ? (
          <div className="qrBox">
            <div className="rowTitle">Scan to open</div>
            <div className="rowDesc">Show this QR to the Arrive Point scanner.</div>
            <div className="qrPlaceholder">
              <div className="muted">QR placeholder</div>
              <div className="hint">Token: {order.id}</div>
            </div>
          </div>
        ) : (
          <div className="field">
            <div className="label">6-digit code</div>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
            />
            <div className="hint">Demo only.</div>
          </div>
        )}

        {!unlocked ? (
          <Button full onClick={doUnlock} disabled={unlocking} icon={unlocking ? <Loader2 size={16} className="spin" /> : null}>
            Unlock
          </Button>
        ) : (
          <div className="notice" style={{ marginTop: 12 }}>
            <ShieldCheck size={18} />
            <div>
              <div className="noticeTitle">Unlocked</div>
              <div className="noticeDesc">Retrieve your order and close the compartment door.</div>
            </div>
          </div>
        )}

        <div className="btnRow" style={{ marginTop: 12 }}>
          <Button variant="outline" onClick={() => alert("Support flow placeholder")}>Pickup help</Button>
          <Button onClick={onDone}>Done</Button>
        </div>
      </Card>
    </div>
  );
}