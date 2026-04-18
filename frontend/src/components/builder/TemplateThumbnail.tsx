// SVG wireframe thumbnails that reflect actual template structure
interface ThumbProps { color: string; small?: boolean; }

function Bar({ x, y, w, h = 2, fill, rx = 0.5, opacity }: { x: number; y: number; w: number | string; h?: number; fill: string; rx?: number; opacity?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} opacity={opacity} />;
}

function SingleColumnThumb({ color }: ThumbProps) {
  return (
    <svg viewBox="0 0 100 135" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="100" height="135" fill="white" />
      {/* Name */}
      <Bar x={6} y={8} w={42} h={5} fill={color} rx={1} />
      {/* Title */}
      <Bar x={6} y={15} w={28} h={2} fill="#bbb" />
      {/* Contact */}
      <Bar x={6} y={19} w={55} h={1.5} fill="#ddd" />
      {/* Accent line */}
      <rect x={6} y={23} width={88} height={1} fill={color} opacity={0.7} />
      {/* Summary label */}
      <Bar x={6} y={27} w={22} h={2} fill={color} opacity={0.8} />
      <Bar x={6} y={31} w={88} h={1.2} fill="#e5e5e5" />
      <Bar x={6} y={34} w={72} h={1.2} fill="#e5e5e5" />
      {/* Experience label */}
      <Bar x={6} y={40} w={28} h={2} fill={color} opacity={0.8} />
      <rect x={6} y={43} width={88} height={0.6} fill="#e5e5e5" />
      {/* Job 1 */}
      <Bar x={6} y={46} w={44} h={2} fill="#555" />
      <Bar x={6} y={50} w={72} h={1.2} fill="#ddd" />
      <Bar x={6} y={53} w={60} h={1.2} fill="#ddd" />
      {/* Job 2 */}
      <Bar x={6} y={58} w={38} h={2} fill="#555" />
      <Bar x={6} y={62} w={80} h={1.2} fill="#ddd" />
      <Bar x={6} y={65} w={65} h={1.2} fill="#ddd" />
      {/* Education label */}
      <Bar x={6} y={71} w={25} h={2} fill={color} opacity={0.8} />
      <rect x={6} y={74} width={88} height={0.6} fill="#e5e5e5" />
      <Bar x={6} y={77} w={50} h={2} fill="#555" />
      <Bar x={6} y={81} w={35} h={1.2} fill="#ddd" />
      {/* Skills label */}
      <Bar x={6} y={87} w={18} h={2} fill={color} opacity={0.8} />
      <rect x={6} y={90} width={88} height={0.6} fill="#e5e5e5" />
      <Bar x={6} y={93} w={85} h={1.5} fill="#eee" />
      <Bar x={6} y={96} w={70} h={1.5} fill="#eee" />
    </svg>
  );
}

function TwoColumnDarkThumb({ color }: ThumbProps) {
  const sidebar = "#1A2B4B";
  const sidebarText = "rgba(255,255,255,0.5)";
  const sidebarAccent = "rgba(255,255,255,0.85)";
  return (
    <svg viewBox="0 0 100 135" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="100" height="135" fill="white" />
      {/* Dark sidebar */}
      <rect x={63} y={0} width={37} height={135} fill={sidebar} />
      {/* Left: Name */}
      <Bar x={5} y={8} w={42} h={5} fill={color} rx={1} />
      <Bar x={5} y={15} w={30} h={2} fill={color} opacity={0.6} />
      {/* Contact row */}
      <Bar x={5} y={20} w={50} h={1.5} fill="#ddd" />
      {/* Accent underline */}
      <rect x={5} y={24} width={54} height={0.8} fill={color} />
      {/* Summary */}
      <Bar x={5} y={27} w={20} h={2} fill={color} opacity={0.8} />
      <Bar x={5} y={31} w={54} h={1.2} fill="#e5e5e5" />
      <Bar x={5} y={34} w={48} h={1.2} fill="#e5e5e5" />
      {/* Experience */}
      <Bar x={5} y={40} w={26} h={2} fill={color} opacity={0.8} />
      <rect x={5} y={43} width={54} height={0.5} fill="#e5e5e5" />
      <Bar x={5} y={46} w={42} h={2} fill="#555" />
      <Bar x={5} y={50} w={52} h={1.2} fill="#ddd" />
      <Bar x={5} y={53} w={45} h={1.2} fill="#ddd" />
      <Bar x={5} y={58} w={36} h={2} fill="#555" />
      <Bar x={5} y={62} w={50} h={1.2} fill="#ddd" />
      <Bar x={5} y={65} w={40} h={1.2} fill="#ddd" />
      {/* Education */}
      <Bar x={5} y={71} w={22} h={2} fill={color} opacity={0.8} />
      <rect x={5} y={74} width={54} height={0.5} fill="#e5e5e5" />
      <Bar x={5} y={77} w={48} h={2} fill="#555" />
      <Bar x={5} y={81} w={35} h={1.2} fill="#ddd" />
      {/* Sidebar: avatar circle */}
      <circle cx={81.5} cy={14} r={7} fill="rgba(255,255,255,0.15)" />
      <circle cx={81.5} cy={12} r={3} fill="rgba(255,255,255,0.3)" />
      {/* Sidebar: Achievements */}
      <Bar x={66} y={25} w={24} h={2} fill={sidebarAccent} />
      <rect x={66} y={28} width={28} height={0.5} fill="rgba(255,255,255,0.2)" />
      <Bar x={68} y={31} w={24} h={1.5} fill={sidebarText} />
      <Bar x={68} y={34} w={20} h={1.2} fill={sidebarText} />
      <Bar x={68} y={39} w={24} h={1.5} fill={sidebarText} />
      <Bar x={68} y={42} w={18} h={1.2} fill={sidebarText} />
      {/* Sidebar: Skills */}
      <Bar x={66} y={50} w={20} h={2} fill={sidebarAccent} />
      <rect x={66} y={53} width={28} height={0.5} fill="rgba(255,255,255,0.2)" />
      <Bar x={68} y={56} w={25} h={1.5} fill={sidebarText} />
      <Bar x={68} y={59} w={22} h={1.5} fill={sidebarText} />
      <Bar x={68} y={62} w={18} h={1.5} fill={sidebarText} />
      {/* Sidebar: Courses */}
      <Bar x={66} y={70} w={18} h={2} fill={sidebarAccent} />
      <rect x={66} y={73} width={28} height={0.5} fill="rgba(255,255,255,0.2)" />
      <Bar x={68} y={76} w={25} h={1.5} fill={sidebarText} />
      <Bar x={68} y={79} w={20} h={1.2} fill={sidebarText} />
    </svg>
  );
}

function CorporateThumb({ color }: ThumbProps) {
  return (
    <svg viewBox="0 0 100 135" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="100" height="135" fill="white" />
      {/* Centered name */}
      <Bar x={25} y={8} w={50} h={5} fill="#111" rx={1} />
      {/* Centered title */}
      <Bar x={20} y={15} w={60} h={2} fill="#555" />
      {/* Centered contact */}
      <Bar x={15} y={19} w={70} h={1.5} fill="#bbb" />
      {/* Full-width rule */}
      <rect x={6} y={23} width={88} height={0.8} fill="#ccc" />
      {/* Experience - centered label */}
      <Bar x={32} y={27} w={36} h={2.5} fill="#111" rx={0.5} />
      <rect x={6} y={31} width={88} height={0.6} fill="#ccc" />
      {/* Job entries - left/right aligned */}
      <Bar x={6} y={34} w={40} h={2} fill="#333" />
      <Bar x={60} y={34} w={28} h={1.5} fill="#aaa" />
      <Bar x={6} y={38} w={28} h={1.5} fill={color} />
      <Bar x={60} y={38} w={22} h={1.2} fill="#bbb" />
      <Bar x={8} y={42} w={80} h={1.2} fill="#e5e5e5" />
      <Bar x={8} y={45} w={72} h={1.2} fill="#e5e5e5" />
      <Bar x={8} y={48} w={65} h={1.2} fill="#e5e5e5" />
      {/* Job 2 */}
      <Bar x={6} y={53} w={36} h={2} fill="#333" />
      <Bar x={60} y={53} w={28} h={1.5} fill="#aaa" />
      <Bar x={6} y={57} w={25} h={1.5} fill={color} />
      <Bar x={8} y={61} w={80} h={1.2} fill="#e5e5e5" />
      <Bar x={8} y={64} w={68} h={1.2} fill="#e5e5e5" />
      {/* Education - centered label */}
      <Bar x={34} y={70} w={32} h={2.5} fill="#111" rx={0.5} />
      <rect x={6} y={74} width={88} height={0.6} fill="#ccc" />
      <Bar x={6} y={77} w={45} h={2} fill="#333" />
      <Bar x={58} y={77} w={30} h={1.5} fill="#aaa" />
      <Bar x={6} y={81} w={32} h={1.5} fill={color} />
      {/* Skills - centered label */}
      <Bar x={36} y={88} w={28} h={2.5} fill="#111" rx={0.5} />
      <rect x={6} y={92} width={88} height={0.6} fill="#ccc" />
      <Bar x={6} y={95} w={88} h={1.5} fill="#eee" />
    </svg>
  );
}

function SidebarModernThumb({ color }: ThumbProps) {
  const sidebarBg = "#F5F7FA";
  return (
    <svg viewBox="0 0 100 135" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="100" height="135" fill="white" />
      {/* Light sidebar */}
      <rect x={60} y={0} width={40} height={135} fill={sidebarBg} />
      {/* Left: Name */}
      <Bar x={4} y={7} w={45} h={5} fill="#111" rx={1} />
      <Bar x={4} y={14} w={32} h={2} fill={color} />
      {/* Contact grid */}
      <Bar x={4} y={18} w={26} h={1.5} fill="#ccc" />
      <Bar x={4} y={21} w={22} h={1.5} fill="#ccc" />
      {/* Accent line */}
      <rect x={4} y={25} width={52} height={0.8} fill={color} opacity={0.4} />
      {/* Summary */}
      <Bar x={4} y={28} w={20} h={2} fill={color} opacity={0.8} />
      <Bar x={4} y={32} w={52} h={1.2} fill="#e5e5e5" />
      <Bar x={4} y={35} w={45} h={1.2} fill="#e5e5e5" />
      {/* Experience */}
      <Bar x={4} y={41} w={26} h={2} fill={color} opacity={0.8} />
      <rect x={4} y={44} width={52} height={0.5} fill="#e5e5e5" />
      <Bar x={4} y={47} w={40} h={2} fill="#333" />
      <Bar x={4} y={51} w={28} h={1.5} fill={color} opacity={0.7} />
      <Bar x={4} y={55} w={50} h={1.2} fill="#e5e5e5" />
      <Bar x={4} y={58} w={42} h={1.2} fill="#e5e5e5" />
      {/* dashed separator */}
      <line x1={4} y1={63} x2={56} y2={63} stroke="#ddd" strokeWidth={0.6} strokeDasharray="2,2" />
      <Bar x={4} y={66} w={36} h={2} fill="#333" />
      <Bar x={4} y={70} w={24} h={1.5} fill={color} opacity={0.7} />
      <Bar x={4} y={74} w={50} h={1.2} fill="#e5e5e5" />
      {/* Education */}
      <Bar x={4} y={80} w={22} h={2} fill={color} opacity={0.8} />
      <rect x={4} y={83} width={52} height={0.5} fill="#e5e5e5" />
      <Bar x={4} y={86} w={45} h={2} fill="#333" />
      <Bar x={4} y={90} w={32} h={1.2} fill="#e5e5e5" />
      {/* Sidebar: Achievements label */}
      <Bar x={63} y={7} w={24} h={2} fill="#333" />
      <rect x={63} y={10} width={32} height={0.5} fill="#ddd" />
      {/* Achievement items with icon dots */}
      <circle cx={65} cy={15} r={1.5} fill={color} />
      <Bar x={68} y={13.5} w={26} h={1.5} fill="#aaa" />
      <Bar x={68} y={16.5} w={20} h={1.2} fill="#ccc" />
      <circle cx={65} cy={22} r={1.5} fill={color} opacity={0.7} />
      <Bar x={68} y={20.5} w={26} h={1.5} fill="#aaa" />
      <Bar x={68} y={23.5} w={18} h={1.2} fill="#ccc" />
      {/* Skills label */}
      <Bar x={63} y={31} w={18} h={2} fill="#333" />
      <rect x={63} y={34} width={32} height={0.5} fill="#ddd" />
      {/* Skill chips */}
      <rect x={63} y={37} width={14} height={4} rx={2} fill={color} opacity={0.15} />
      <rect x={79} y={37} width={14} height={4} rx={2} fill={color} opacity={0.15} />
      <rect x={63} y={43} width={18} height={4} rx={2} fill={color} opacity={0.15} />
      <rect x={83} y={43} width={10} height={4} rx={2} fill={color} opacity={0.15} />
      <rect x={63} y={49} width={12} height={4} rx={2} fill={color} opacity={0.15} />
      {/* Pie chart area */}
      <Bar x={63} y={60} w={22} h={2} fill="#333" />
      <circle cx={81} cy={77} r={10} fill="none" stroke="#eee" strokeWidth={5} />
      <circle cx={81} cy={77} r={10} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray="20 43" strokeDashoffset="0" opacity={0.8} />
      <circle cx={81} cy={77} r={10} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray="13 50" strokeDashoffset="-20" opacity={0.5} />
    </svg>
  );
}

function ExecutiveThumb({ color }: ThumbProps) {
  return (
    <svg viewBox="0 0 100 135" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="100" height="135" fill="white" />
      {/* Bold color header band */}
      <rect x={0} y={0} width={100} height={28} fill={color} opacity={0.12} />
      <Bar x={6} y={6} w={55} h={7} fill={color} rx={1} />
      <Bar x={6} y={15} w={36} h={2.5} fill="#444" />
      <Bar x={6} y={21} w={60} h={1.5} fill="#bbb" />
      {/* Thick accent */}
      <rect x={0} y={28} width={100} height={2.5} fill={color} />
      {/* Summary */}
      <Bar x={6} y={34} w={22} h={2} fill={color} opacity={0.9} />
      <Bar x={6} y={38} w={88} h={1.2} fill="#e5e5e5" />
      <Bar x={6} y={41} w={78} h={1.2} fill="#e5e5e5" />
      {/* Experience */}
      <Bar x={6} y={47} w={28} h={2} fill={color} opacity={0.9} />
      <rect x={6} y={50} width={88} height={0.5} fill="#e5e5e5" />
      <Bar x={6} y={53} w={50} h={2.5} fill="#222" />
      <Bar x={6} y={58} w={85} h={1.2} fill="#e5e5e5" />
      <Bar x={6} y={61} w={72} h={1.2} fill="#e5e5e5" />
      <Bar x={6} y={64} w={80} h={1.2} fill="#e5e5e5" />
      <Bar x={6} y={70} w={44} h={2.5} fill="#222" />
      <Bar x={6} y={75} w={80} h={1.2} fill="#e5e5e5" />
      <Bar x={6} y={78} w={65} h={1.2} fill="#e5e5e5" />
      {/* Education */}
      <Bar x={6} y={84} w={24} h={2} fill={color} opacity={0.9} />
      <rect x={6} y={87} width={88} height={0.5} fill="#e5e5e5" />
      <Bar x={6} y={90} w={52} h={2} fill="#222" />
      <Bar x={6} y={94} w={38} h={1.2} fill="#e5e5e5" />
    </svg>
  );
}

function MinimalThumb({ color }: ThumbProps) {
  return (
    <svg viewBox="0 0 100 135" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="100" height="135" fill="white" />
      <Bar x={6} y={10} w={48} h={6} fill="#111" rx={1} />
      <Bar x={6} y={18} w={32} h={1.5} fill="#888" />
      <Bar x={6} y={22} w={60} h={1} fill="#ddd" />
      <rect x={6} y={26} width={88} height={0.5} fill="#ddd" />
      <Bar x={6} y={30} w={20} h={1.5} fill="#bbb" />
      <Bar x={6} y={34} w={88} h={1} fill="#eee" />
      <Bar x={6} y={37} w={78} h={1} fill="#eee" />
      <rect x={6} y={43} width={88} height={0.3} fill="#e5e5e5" />
      <Bar x={6} y={46} w={24} h={1.5} fill="#bbb" />
      <Bar x={6} y={50} w={50} h={2} fill="#333" />
      <Bar x={6} y={54} w={88} h={1} fill="#eee" />
      <Bar x={6} y={57} w={72} h={1} fill="#eee" />
      <Bar x={6} y={60} w={80} h={1} fill="#eee" />
      <Bar x={6} y={66} w={42} h={2} fill="#333" />
      <Bar x={6} y={70} w={88} h={1} fill="#eee" />
      <Bar x={6} y={73} w={60} h={1} fill="#eee" />
      <rect x={6} y={79} width={88} height={0.3} fill="#e5e5e5" />
      <Bar x={6} y={82} w={22} h={1.5} fill="#bbb" />
      <Bar x={6} y={86} w={48} h={2} fill="#333" />
      <Bar x={6} y={90} w={35} h={1} fill="#eee" />
    </svg>
  );
}

const THUMB_MAP: Record<string, (p: ThumbProps) => JSX.Element> = {
  "classic":         (p) => <SingleColumnThumb {...p} />,
  "modern":          (p) => <SingleColumnThumb {...p} />,
  "technical":       (p) => <SingleColumnThumb {...p} />,
  "creative":        (p) => <SingleColumnThumb {...p} />,
  "executive":       (p) => <ExecutiveThumb {...p} />,
  "minimal":         (p) => <MinimalThumb {...p} />,
  "two-column-dark": (p) => <TwoColumnDarkThumb {...p} />,
  "corporate":       (p) => <CorporateThumb {...p} />,
  "sidebar-modern":  (p) => <SidebarModernThumb {...p} />,
};

export function TemplateThumbnail({ slug, color }: { slug: string; color: string }) {
  const render = THUMB_MAP[slug] ?? THUMB_MAP["two-column-dark"];
  return render({ color });
}
