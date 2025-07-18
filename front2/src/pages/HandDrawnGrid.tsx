import React from 'react';

interface HandDrawnGridProps {
  chars: string[]; // 49글자 배열
  width?: number;
  height?: number;
}

// 손그림 느낌의 7x7 원고지 SVG
const HandDrawnGrid: React.FC<HandDrawnGridProps> = ({ chars, width = 350, height = 220 }) => {
  const rows = 7;
  const cols = 7;
  const cellW = width / cols;
  const cellH = height / rows;

  // 손그림 느낌의 선 좌표(약간의 흔들림)
  const jitter = (v: number, amt: number) => v + (Math.random() - 0.5) * amt;

  // 가로줄
  const hLines = Array.from({ length: rows + 1 }, (_, r) => (
    <polyline
      key={r}
      points={Array.from({ length: cols + 1 }, (_, c) => `${jitter(c * cellW, 2)},${jitter(r * cellH, 1.5)}`).join(' ')}
      stroke="#222"
      strokeWidth={1.2}
      fill="none"
      strokeLinejoin="round"
      opacity={0.8}
    />
  ));
  // 세로줄
  const vLines = Array.from({ length: cols + 1 }, (_, c) => (
    <polyline
      key={c}
      points={Array.from({ length: rows + 1 }, (_, r) => `${jitter(c * cellW, 1.5)},${jitter(r * cellH, 2)}`).join(' ')}
      stroke="#222"
      strokeWidth={1.2}
      fill="none"
      strokeLinejoin="round"
      opacity={0.8}
    />
  ));

  // 각 칸에 글자
  const texts = chars.slice(0, rows * cols).map((ch, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    return (
      <text
        key={i}
        x={c * cellW + cellW / 2}
        y={r * cellH + cellH / 2 + 2}
        fontFamily="HakgyoansimDoldamB, Nanum Pen Script, sans-serif"
        fontSize={20}
        textAnchor="middle"
        alignmentBaseline="middle"
        fill="#222"
      >
        {ch}
      </text>
    );
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{background:'#FFF9F4', borderRadius:6, display:'block', width:'100%', height:'auto'}}>
      {/* 바깥 테두리 */}
      <polyline points={`2,2 ${width-2},2 ${width-2},${height-2} 2,${height-2} 2,2`}
        fill="none" stroke="#222" strokeWidth={1.5} strokeLinejoin="round" opacity={0.9} />
      {hLines}
      {vLines}
      {texts}
    </svg>
  );
};

export default HandDrawnGrid; 