import styles from "./for-business.module.css";

export type StreetBuildingKind =
  | "salon"
  | "garage"
  | "clinic"
  | "studio"
  | "wellness"
  | "school"
  | "gym"
  | "groomer";

/** Recesses stay inside the original openings; daylight comes from the left. */
function WindowDepth({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  return (
    <>
      <path className={styles.windowShade} d={`M${x} ${y}h${width}v3h${3 - width}v${height - 3}h-3Z`} />
      <path className={styles.windowLight} d={`M${x + width - 1.5} ${y + 5}v${height - 6.5}H${x + 5}`} />
    </>
  );
}

function ArchDepth({ x, springY, radius, bottom }: { x: number; springY: number; radius: number; bottom: number }) {
  return (
    <>
      <path
        className={styles.windowShade}
        d={`M${x} ${bottom}V${springY}a${radius} ${radius} 0 0 1 ${radius * 2} 0h-3a${radius - 3} ${radius - 3} 0 0 0 ${6 - radius * 2} 0V${bottom}Z`}
      />
      <path className={styles.windowLight} d={`M${x + radius * 2 - 1.5} ${springY + 5}V${bottom - 1.5}`} />
    </>
  );
}

/** A shallow cast shadow stays on the pavement while a storefront lifts. */
export function StreetBuildingShadow({ kind }: { kind: StreetBuildingKind }) {
  const footprints: Record<StreetBuildingKind, [number, number, number]> = {
    salon: [12, 186, 200],
    garage: [8, 198, 200],
    clinic: [10, 178, 240],
    studio: [14, 245, 200],
    wellness: [10, 184, 200],
    school: [21, 209, 200],
    gym: [8, 198, 200],
    groomer: [12, 176, 200],
  };
  const [left, right, ground] = footprints[kind];
  return <path className={styles.groundShadow} d={`M${left} ${ground}H${right}l8 7H${left + 8}Z`} />;
}

/** Local ground is y=200, except the taller clinic at y=240. */
export function StreetBuilding({ kind }: { kind: StreetBuildingKind }) {
  switch (kind) {
    case "salon":
      return (
        <g className={styles.building}>
          <path className={styles.sideWall} d="m178 57 8 6v137h-8Z" />
          <path className={styles.stone} d="M12 200V57h166v143M19 57V43h152v14" />
          <path className={styles.roofDepth} d="M12 57h166v5H12Z" />
          <path className={styles.line} d="M6 57h178M14 191h51m59 0h52" />
          <path className={styles.windowLight} d="M21 45h148" />
          <path className={styles.window} d="M24 73h142l-8 18H32Z" />
          <path className={styles.roofDepth} d="M32 91h126l-4 5H36Z" />
          <path className={styles.ledge} d="m45 73-2 18m25-18-1 18m26-18v18m25-18 1 18m25-18 2 18" />
          <path className={styles.window} d="M28 165v-39a17 17 0 0 1 34 0v39Zm100 0v-39a17 17 0 0 1 34 0v39ZM76 200v-62a19 19 0 0 1 38 0v62" />
          <ArchDepth x={28} springY={126} radius={17} bottom={165} />
          <ArchDepth x={128} springY={126} radius={17} bottom={165} />
          <ArchDepth x={76} springY={138} radius={19} bottom={200} />
          <path className={styles.ledge} d="M45 109v56m100-56v56M22 165h46m54 0h46" />
          <path className={styles.line} d="M105 170v7" />
        </g>
      );
    case "garage":
      return (
        <g className={styles.building}>
          <path className={styles.sideWall} d="m192 83 6 5v112h-6Z" />
          <path className={styles.stone} d="M8 200V83h184v117M31 83V60h138v23" />
          <path className={styles.roofDepth} d="M8 83h184v5H8Z" />
          <path className={styles.line} d="M2 83h196" />
          <path className={styles.windowLight} d="M33 62h134" />
          <path className={styles.window} d="M26 200V103h148v97" />
          <WindowDepth x={26} y={103} width={148} height={97} />
          <path className={styles.ledge} d="M26 118h148M26 134h148M26 150h148M26 166h148M26 182h148M52 72h96" />
          <path className={styles.windowLight} d="M31 120h138m-138 32h138m-138 32h138" />
          <path className={styles.line} d="M94 191h12" />
        </g>
      );
    case "clinic":
      return (
        <g className={styles.building}>
          <path className={styles.sideWall} d="m170 35 8 7v198h-8Z" />
          <path className={styles.stone} d="M10 240V35h160v205M17 35V23h146v12" />
          <path className={styles.roofDepth} d="M10 35h160v5H10ZM20 157h140v4H20Z" />
          <path className={styles.line} d="M4 35h172" />
          <path className={styles.windowLight} d="M19 25h142" />
          <path className={styles.window} d="M26 54h32v38H26Zm48 0h32v38H74Zm48 0h32v38h-32ZM26 108h32v38H26Zm48 0h32v38H74Zm48 0h32v38h-32Z" />
          {[54, 108].map((y) => [26, 74, 122].map((x) => (
            <WindowDepth key={`${x}-${y}`} x={x} y={y} width={32} height={38} />
          )))}
          <path className={styles.ledge} d="M42 54v38m48-38v38m48-38v38M42 108v38m48-38v38m48-38v38M20 157h140" />
          <path className={styles.window} d="M52 240v-62h76v62M42 165h96l-8 10H50Z" />
          <WindowDepth x={52} y={178} width={76} height={62} />
          <path className={styles.roofDepth} d="M50 175h80l-3 5H53Z" />
          <path className={styles.line} d="M90 178v62m-6-32v7m12-7v7" />
        </g>
      );
    case "studio":
      return (
        <g className={styles.building}>
          {/* The shallow side wall and sill give the foreground shop its depth. */}
          <path className={styles.sideWall} d="m230 48 15 12v140h-15Z" />
          <path className={styles.shopFront} d="M14 200V48h216v152" />
          <path className={styles.stone} d="M8 48V34h228v14ZM21 34V23h202v11" />
          <path className={styles.roofDepth} d="M14 48h216v6H14Z" />
          <path className={styles.windowLight} d="M23 25h198M10 36h224" />
          <path className={styles.ledge} d="M19 55h206M16 191h52m67 0h94" />
          <path className={styles.window} d="M30 117V72h184v45Z" />
          <WindowDepth x={30} y={72} width={184} height={45} />
          <path className={styles.ledge} d="M76 72v45m46-45v45m46-45v45M30 94h184" />
          <path className={styles.awning} d="M22 112h200l-11 23H33Z" />
          <path className={styles.awningStripe} d="M40 112h16l6 23H48ZM72 112h16l3 23H77ZM104 112h16v23h-14ZM136 112h16l-3 23h-15ZM168 112h16l-6 23h-14ZM200 112h13l-10 23h-11Z" />
          <path className={styles.roofDepth} d="M33 135h178l-4 6H37Z" />
          <path className={styles.window} d="M35 181v-34h33v34Zm111 0v-34h64v34ZM80 200v-57h52v57" />
          <WindowDepth x={35} y={147} width={33} height={34} />
          <WindowDepth x={146} y={147} width={64} height={34} />
          <WindowDepth x={80} y={143} width={52} height={57} />
          <path className={styles.ledge} d="M178 147v34M82 157h48m-24-14v57" />
          <path className={styles.line} d="M122 172v7" />
          <path className={styles.stone} d="M73 200h67v5H73Z" />
          <path className={styles.windowLight} d="M75 201h63" />
          <Planter x={0} y={200} />
          <Planter x={230} y={200} />
        </g>
      );
    case "wellness":
      return (
        <g className={styles.building}>
          <path className={styles.sideWall} d="m176 69 8 6v125h-8Z" />
          <path className={styles.stone} d="M10 200V67a12 12 0 0 1 12-12h142a12 12 0 0 1 12 12v133" />
          <path className={styles.roofDepth} d="M20 65h146v5H20Z" />
          <path className={styles.windowLight} d="M23 58h138" />
          <path className={styles.ledge} d="M20 65h146M12 191h65m56 0h40" />
          <path className={styles.window} d="M29 155v-48a23 23 0 0 1 46 0v48ZM110 200v-69a23 23 0 0 1 46 0v69" />
          <ArchDepth x={29} springY={107} radius={23} bottom={155} />
          <ArchDepth x={110} springY={131} radius={23} bottom={200} />
          <path className={styles.ledge} d="M52 84v71m-23-27h46M133 108v20" />
          <path className={styles.line} d="M146 168v7" />
          <Planter x={16} y={200} />
        </g>
      );
    case "school":
      return (
        <g className={styles.building}>
          <path className={styles.sideWall} d="m199 68 10 7v125h-10Z" />
          <path className={styles.stone} d="M21 200V68h178v132M10 68 110 20l100 48Z" />
          <path className={styles.roofDepth} d="M21 68h178v7H21ZM40 90h3v98h-3Zm23 0h3v98h-3Zm100 0h3v98h-3Zm23 0h3v98h-3Z" />
          <path className={styles.windowLight} d="m24 64 86-41 86 41" />
          <path className={styles.line} d="M16 78h188" />
          <path className={styles.ledge} d="M37 90v98m23-98v98m100-98v98m23-98v98" />
          <path className={styles.window} d="M43 106h17v31H43Zm117 0h17v31h-17ZM92 200v-58h36v58" />
          <WindowDepth x={43} y={106} width={17} height={31} />
          <WindowDepth x={160} y={106} width={17} height={31} />
          <WindowDepth x={92} y={142} width={36} height={58} />
          <path className={styles.ledge} d="M82 194h56" />
        </g>
      );
    case "gym":
      return (
        <g className={styles.building}>
          {/* A low industrial roof and broad glazing distinguish the gym. */}
          <path className={styles.sideWall} d="m192 71 6 5v124h-6Z" />
          <path className={styles.stone} d="M8 200V71h184v129M8 71V57h184v14M45 57V42h110v15" />
          <path className={styles.roofDepth} d="M8 71h184v5H8Z" />
          <path className={styles.line} d="M2 71h196" />
          <path className={styles.windowLight} d="M47 44h106M10 59h180" />
          <path className={styles.ledge} d="M55 49h90M16 78h168" />
          <path className={styles.window} d="M24 86h152v20H24ZM24 200v-80h152v80" />
          <WindowDepth x={24} y={86} width={152} height={20} />
          <WindowDepth x={24} y={120} width={152} height={80} />
          <path className={styles.ledge} d="M62 86v20m38-20v20m38-20v20M24 144h152M62 120v80m38-80v80m38-80v80" />
          <path className={styles.line} d="M94 166v9m12-9v9" />
          <path className={styles.ledge} d="M12 192h12m152 0h12" />
        </g>
      );
    case "groomer":
      return (
        <g className={styles.building}>
          {/* A modest stepped parapet sits over a rounded shop window and door. */}
          <path className={styles.sideWall} d="m168 88 8 6v106h-8Z" />
          <path className={styles.stone} d="M12 200V88h156v112M23 88V72h28V58h78v14h28v16" />
          <path className={styles.roofDepth} d="M12 88h156v5H12Z" />
          <path className={styles.line} d="M6 88h168" />
          <path className={styles.windowLight} d="M53 60h74M25 74h26m78 0h26" />
          <path className={styles.ledge} d="M59 66h62M31 80h118M20 96h140" />
          <path className={styles.window} d="M28 174v-32a30 30 0 0 1 60 0v32ZM118 200v-64a16 16 0 0 1 32 0v64" />
          <ArchDepth x={28} springY={142} radius={30} bottom={174} />
          <ArchDepth x={118} springY={136} radius={16} bottom={200} />
          <path className={styles.ledge} d="M58 112v62m-30-23h60M134 120v23M22 179h72M14 192h88" />
          <path className={styles.line} d="M142 169v7" />
          <Planter x={94} y={200} />
        </g>
      );
  }
}

export function Planter({ x, y }: { x: number; y: number }) {
  return (
    <g className={styles.building} transform={`translate(${x} ${y})`}>
      <path className={styles.stone} d="M0-15h17L14 0H3Z" />
      <path className={styles.roofDepth} d="M12-15h5L14 0h-4Z" />
      <path className={styles.windowLight} d="m2-13 2 10" />
      <path className={styles.window} d="M8-15v-23m0 13C1-25-2-31 0-35c5 0 8 4 8 10Zm1-5c0-8 4-12 8-13 2 6-1 12-8 13Z" />
    </g>
  );
}
