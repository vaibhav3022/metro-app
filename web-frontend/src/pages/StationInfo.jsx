import React, { useState, useEffect } from 'react';
import { Train, Clock, MapPin, Bus, X } from 'lucide-react';

const STATIONS = [
  "PCMC", "Sant Tukaram Nagar", "Bhosari (Nashik Phata)", "Kasarwadi",
  "Phugewadi", "Dapodi", "Bopodi", "Khadki", "Range Hills",
  "Shivaji Nagar", "Civil Court", "Budhwar Peth", "Mandai", "Swargate",
  "Vanaz", "Anand Nagar", "Ideal Colony", "Nal Stop",
  "Garware College", "Deccan Gymkhana", "Chhatrapati Sambhaji Udyan",
  "PMC", "Mangalwar Peth", "Pune Railway Station",
  "Ruby Hall Clinic", "Bund Garden", "Yerawada", "Kalyani Nagar", "Ramwadi"
];

const FACILITY_DETAILS = {
  'Parking Available': {
    desc: 'Secured two-wheeler & four-wheeler parking spaces outside the station. Safe, CCTV-monitored, and open during station hours.',
    img: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=500&q=80'
  },
  'Elevators / Lifts': {
    desc: 'High-speed vertical passenger lifts connecting street level to concourse and platforms. Ideal for elderly, disabled, or passengers with heavy luggage.',
    img: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=500&q=80'
  },
  'Escalators': {
    desc: 'Heavy-duty automatic bi-directional escalators installed between concourse and platform levels for comfortable commuting.',
    img: 'https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=500&q=80'
  },
  'Drinking Water': {
    desc: 'Free, clean RO-purified cold drinking water fountains are located on the concourse level for all metro commuters.',
    img: 'https://images.unsplash.com/photo-1548839130-3bf6047b99c0?w=500&q=80'
  },
  'Washrooms': {
    desc: 'Well-maintained public washrooms (separate for male, female, and differently-abled passengers) are available near the concourse ticketing area.',
    img: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=500&q=80'
  },
  'Interchange': {
    desc: 'Multi-line interchange hub. Connects the Purple Line (Line 1) and Aqua Line (Line 2) seamlessly with clear physical corridors and transit signage.',
    img: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=500&q=80'
  }
};

const FACILITY_EXTRAS = {
  'Parking Available': [
    '• Rates: ₹10/hour for Two-wheelers, ₹20/hour for Four-wheelers.',
    '• Overnight parking is permitted with pre-authorization from the station manager.',
    '• Free parking for the first 15 minutes to facilitate passenger drop-offs.',
    '• CCTV-monitored 24/7 with active security guards patrolling.'
  ],
  'Elevators / Lifts': [
    '• Priority access given to senior citizens, disabled passengers, and pregnant women.',
    '• Equipped with Braille control buttons and voice assistants for visually impaired.',
    '• Fits up to 8 passengers or a standard wheelchair easily.',
    '• Direct connectivity from street levels straight to the ticketing concourse and platforms.'
  ],
  'Escalators': [
    '• Bi-directional escalators that automatically run in standby energy-saving mode when empty.',
    '• Always hold the handrail and stand on the left to allow others to pass on the right.',
    '• Do not carry heavy luggage, strollers, or open carts on the escalators (use lifts instead).',
    '• Emergency stop buttons are located at the top and bottom of the escalators.'
  ],
  'Drinking Water': [
    '• Multi-stage RO filtration system with integrated UV sterilizer.',
    '• Delivers chilled, clean drinking water free of charge.',
    '• Environmentally friendly: Commuters are encouraged to refill reusable water bottles.',
    '• Regularly tested for purity standards by the municipal health department.'
  ],
  'Washrooms': [
    '• Separate hygiene blocks for Men, Women, and Gender-Neutral/Differently-abled.',
    '• Toilet paper, handwash soap, and hand dryers are fully stocked.',
    '• Wheelchair accessible wide entries with handrail support bars.',
    '• Daily deep sanitization schedules are posted on the entry doors.'
  ],
  'Interchange': [
    '• Switch lines seamlessly at Shivaji Nagar & Civil Court without exiting the ticketing gates.',
    '• Floor signage colors: Follow the Purple decals for Line 1 and Aqua decals for Line 2.',
    '• Direct escalators connect the elevated Aqua Line to the underground Purple Line.',
    '• Dedicated transit assistance desk is present on the concourse level.'
  ]
};

const getFacilities = (stationName) => {
  const isInterchange = ["Civil Court", "Shivaji Nagar"].includes(stationName);
  const hasParking = ["PCMC", "Swargate", "Vanaz", "Ramwadi", "Pune Railway Station"].includes(stationName);
  return [
    { id: '1', name: 'Parking Available', icon: '🅿️', status: hasParking },
    { id: '2', name: 'Elevators / Lifts', icon: '🛗', status: true },
    { id: '3', name: 'Escalators', icon: '↗️', status: true },
    { id: '4', name: 'Drinking Water', icon: '💧', status: true },
    { id: '5', name: 'Washrooms', icon: '🚻', status: true },
    { id: '6', name: 'Interchange', icon: '⇄', status: isInterchange }
  ];
};

const getStationDetails = (stationName) => {
  const isPurple = [
    "PCMC", "Sant Tukaram Nagar", "Bhosari (Nashik Phata)", "Kasarwadi",
    "Phugewadi", "Dapodi", "Bopodi", "Khadki", "Range Hills",
    "Shivaji Nagar", "Civil Court", "Budhwar Peth", "Mandai", "Swargate"
  ].includes(stationName);

  const bannerImages = [
    'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=800&q=80',
    'https://images.unsplash.com/photo-1541423408854-5df73dbb6e90?w=800&q=80',
    'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80',
    'https://images.unsplash.com/photo-1515165504660-7e9b4866ee11?w=800&q=80'
  ];
  const hash = stationName.length % bannerImages.length;

  return {
    line: stationName === "Civil Court" || stationName === "Shivaji Nagar" ? "Interchange Node" : (isPurple ? "Purple Line (Line 1)" : "Aqua Line (Line 2)"),
    lineColor: stationName === "Civil Court" || stationName === "Shivaji Nagar" ? "#D97706" : (isPurple ? "var(--accent-purple)" : "var(--accent-teal)"),
    timings: '06:00 AM - 10:00 PM',
    feeders: 'E-Auto Rickshaw, Feeder Bus services available',
    banner: bannerImages[hash]
  };
};

export default function StationInfo() {
  const [station, setStation] = useState("Civil Court");
  const [selectedFacility, setSelectedFacility] = useState(null);

  const facilities = getFacilities(station);
  const details = getStationDetails(station);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Station Info & Facilities
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        View available facilities, timings, feeder connections, and maps across all Pune Metro stations.
      </p>

      {/* Selector panel */}
      <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(0, 137, 123, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--glass-border)' }}>
            <Train size={20} color="var(--accent-teal)" />
          </div>
          <label style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Select Metro Station</label>
        </div>
        
        <select 
          className="input-field" 
          value={station} 
          onChange={(e) => setStation(e.target.value)}
          style={{ width: '100%', appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        >
          {STATIONS.map(st => (
            <option key={st} value={st} style={{ color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>{st}</option>
          ))}
        </select>
      </div>

      {/* Station Banner Card */}
      <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '40px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '100%', height: '240px', overflow: 'hidden', position: 'relative' }}>
          <SafeImage 
            src={details.banner} 
            alt={station} 
            fallbackIcon={<Train size={48} />} 
            fallbackText={`${station} Metro Station`} 
          />
          <div style={{ position: 'absolute', top: '16px', left: '16px', padding: '6px 12px', background: details.lineColor, color: '#fff', borderRadius: '20px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: 'var(--box-shadow)' }}>
            {details.line}
          </div>
        </div>
        <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px' }}>{station}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <MapPin size={14} color="var(--accent-teal)" />
              <span>Pune Metro Transit System Network</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-teal)' }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>HOURS OF OPERATION</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{details.timings}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-purple)' }}>
                <Bus size={20} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>FEEDER CONNECTIVITY</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{details.feeders}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Facilities Title */}
      <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '24px', letterSpacing: '0.5px' }}>
        Facilities at {station} Station
      </h3>
      
      {/* Detailed Facilities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {facilities.map((fac) => (
          <FacilityCard key={fac.id} fac={fac} onSelect={setSelectedFacility} />
        ))}
      </div>

      {/* Details Popup Modal */}
      {selectedFacility && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-panel" style={{ background: 'var(--bg-secondary)', width: '90%', maxWidth: '500px', borderRadius: '32px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', padding: '24px', boxShadow: 'var(--box-shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>{selectedFacility.icon}</span>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)' }}>{selectedFacility.name}</h2>
              </div>
              <button onClick={() => setSelectedFacility(null)} className="btn" style={{ background: 'var(--bg-primary)', padding: '8px', borderRadius: '16px', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ width: '100%', height: '200px', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
              <SafeImage 
                src={FACILITY_DETAILS[selectedFacility.name]?.img} 
                alt={selectedFacility.name} 
                fallbackIcon={selectedFacility.icon} 
                fallbackText={selectedFacility.name} 
              />
            </div>

            <div style={{ background: 'var(--bg-primary)', borderRadius: '20px', padding: '20px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>STATUS:</span>
                {selectedFacility.status ? (
                  <span className="badge badge-success">Fully Functional</span>
                ) : (
                  <span className="badge badge-danger">Temporarily Suspended</span>
                )}
              </div>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>DESCRIPTION:</span>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                  {FACILITY_DETAILS[selectedFacility.name]?.desc}
                </p>
              </div>
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>GUIDELINES & RULES:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {FACILITY_EXTRAS[selectedFacility.name]?.map((rule, index) => (
                    <span key={index} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{rule}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedFacility(null)} 
              className="btn btn-primary" 
              style={{ width: '100%', height: '48px', marginTop: '20px' }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// FacilityCard Sub-component for individual card state (image error handling, clicks)
function FacilityCard({ fac, onSelect }) {
  const detail = FACILITY_DETAILS[fac.name] || { desc: '', img: '' };

  return (
    <div 
      className="glass-panel" 
      onClick={() => onSelect(fac)}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: fac.status ? 1 : 0.55,
        border: fac.status ? '1px solid var(--glass-border)' : '1px solid var(--bg-tertiary)',
        transition: 'transform 0.2s ease, border-color 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--accent-teal)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = fac.status ? 'var(--glass-border)' : 'var(--bg-tertiary)';
      }}
    >
      <div style={{ width: '100%', height: '140px', overflow: 'hidden', position: 'relative' }}>
        <SafeImage 
          src={detail.img} 
          alt={fac.name} 
          fallbackIcon={fac.icon} 
          fallbackText={fac.name} 
        />
        <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '20px', background: 'var(--bg-secondary)', width: '36px', height: '36px', borderRadius: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'var(--box-shadow)' }}>
          {fac.icon}
        </div>
      </div>
      
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{fac.name}</h4>
          {fac.status ? (
            <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 8px' }}>Available</span>
          ) : (
            <span className="badge badge-danger" style={{ fontSize: '10px', padding: '2px 8px' }}>Unavailable</span>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {detail.desc}
        </p>
      </div>
    </div>
  );
}

// Reusable Image loading checker component with a gorgeous Pune Metro gradient fallback
function SafeImage({ src, alt, fallbackIcon, fallbackText, style, imgStyle }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    if (src) {
      const img = new Image();
      img.src = src;
      img.onload = () => setError(false);
      img.onerror = () => setError(true);
    } else {
      setError(true);
    }
  }, [src]);

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#ffffff',
        gap: '12px',
        padding: '20px',
        textAlign: 'center',
        ...style 
      }}>
        {fallbackIcon && (
          <div style={{ fontSize: typeof fallbackIcon === 'string' ? '48px' : 'inherit' }}>
            {fallbackIcon}
          </div>
        )}
        {fallbackText && (
          <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px' }}>
            {fallbackText}
          </span>
        )}
      </div>
    );
  }

  return <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', ...imgStyle }} />;
}

