"use client";

import { useMemo, useState } from "react";

const guideLinks = [
  "DPS 이해하기",
  "Increased vs More",
  "적 저항과 관통",
  "버프와 차지",
  "패시브 계산 방식",
  "간편 PoB 이용안내",
  "FAQ",
];

const currentStats = [
  ["힘 / 민첩 / 지능", "81 / 171 / 122", "triple"],
  ["이동 속도", "99%", ""],
  ["아이템 희귀도", "81%", ""],
  ["차지", "3 / 6 / 3", "triple"],
  ["생명력", "1,819", ""],
  ["에너지 보호막", "2,535", ""],
  ["룬 보호막", "252", ""],
  ["마나", "708", ""],
  ["정신력", "273", ""],
  ["방어도", "-", ""],
  ["회피", "21,606", ""],
  ["회피 확률", "73%", ""],
  ["디플렉션", "19,229", ""],
  ["디플렉션 확률", "88%", ""],
  ["물리 피해 감소", "5%", ""],
  ["저항", "75 / 75 / 75 / 27%", "resist"],
  ["유효 체력", "59k", ""],
  ["최대 피격", "5.6k / 19k / 19k / 5.4k", "muted"],
  ["생명력 재생", "62/s", ""],
  ["마나 재생", "67/s", ""],
  ["ES 충전", "370/s", ""],
  ["충전 지연", "3.39s", ""],
];

const changedStats = [
  ["힘 / 민첩 / 지능", "81 / 184 / 122", "triple"],
  ["이동 속도", "99%", ""],
  ["아이템 희귀도", "81%", ""],
  ["차지", "3 / 6 / 3", "triple"],
  ["생명력", "1,904", "gain"],
  ["에너지 보호막", "2,482", "loss"],
  ["룬 보호막", "252", ""],
  ["마나", "708", ""],
  ["정신력", "273", ""],
  ["방어도", "-", ""],
  ["회피", "23,104", "gain"],
  ["회피 확률", "75%", "gain"],
  ["디플렉션", "19,229", ""],
  ["디플렉션 확률", "88%", ""],
  ["물리 피해 감소", "5%", ""],
  ["저항", "75 / 75 / 75 / 35%", "gain"],
  ["유효 체력", "61k", "gain"],
  ["최대 피격", "5.9k / 19k / 19k / 5.8k", "gain"],
  ["생명력 재생", "66/s", "gain"],
  ["마나 재생", "67/s", ""],
  ["ES 충전", "363/s", "loss"],
  ["충전 지연", "3.39s", ""],
];

const skills = [
  { name: "Whirling Slash", support: "Rage III · Rapid Attacks III · Blazing Critical", dps: "391k", tone: "gold" },
  { name: "Twister", support: "Magnified Area III · Rigwald's Ferocity", dps: "8.1k", tone: "gold" },
  { name: "Barrage", support: "Heightened Charges · Perpetual Charge", dps: "2.7k", tone: "green" },
  { name: "Sniper's Mark", support: "Charge Profusion II · Eternal Mark", dps: "Utility", tone: "green" },
  { name: "Herald of Ice", support: "Elemental Armament II · Magnified Area II", dps: "1.6k", tone: "blue" },
  { name: "Armour Demolisher II", support: "Breachlord's Rite", dps: "Utility", tone: "red" },
];

const equipment = [
  { cls: "weapon", label: "창", sub: "무기" },
  { cls: "offhand", label: "방패", sub: "보조" },
  { cls: "helm", label: "투구", sub: "" },
  { cls: "body", label: "갑옷", sub: "" },
  { cls: "gloves", label: "장갑", sub: "" },
  { cls: "boots", label: "장화", sub: "" },
  { cls: "ring-a", label: "반지", sub: "I" },
  { cls: "ring-b", label: "반지", sub: "II" },
  { cls: "amulet", label: "목걸이", sub: "" },
  { cls: "belt", label: "벨트", sub: "" },
  { cls: "charm-a", label: "호신부", sub: "I" },
  { cls: "charm-b", label: "호신부", sub: "II" },
  { cls: "charm-c", label: "호신부", sub: "III" },
  { cls: "flask-a", label: "생명력", sub: "플라스크" },
  { cls: "flask-b", label: "마나", sub: "플라스크" },
];

const jewels = ["눈", "심장", "가시", "목소리", "에메랄드", "구울", "랩처", "실버"];

export default function Home() {
  const [screen, setScreen] = useState<"landing" | "game">("landing");
  const [compareReady, setCompareReady] = useState(true);
  const mainSkills = useMemo(() => skills.slice(0, 2), []);

  if (screen === "game") {
    return (
      <main className="game-shell">
        <div className="game-frame">
          <aside className="ad-rail left" aria-label="좌측 광고 영역">
            <div className="ad-placeholder">
              <small>ADSENSE</small>
              <strong>좌측 광고 자리</strong>
            </div>
          </aside>

          <div className="game-main">
            <section className="character-viewport">
              <header className="character-header">
                <div className="portrait">FIX</div>
                <div className="character-title">
                  <span>FORBIDDEN RITES LEAGUE</span>
                  <h1>ResurrectResurrected</h1>
                  <p>Level 100 Gemling Legionnaire</p>
                </div>
                <div className="character-head-actions">
                  <button className="head-button" onClick={() => setScreen("landing")}>메인으로</button>
                  <button className="head-button accent">다른 캐릭터</button>
                  <div className="sync-state"><small>LAST FETCHED</small><b>방금 전</b></div>
                </div>
              </header>

              <div className="character-grid">
                <section className="equipment-card panel-card">
                  <div className="panel-title">Equipment</div>
                  <div className="equipment-stage">
                    {equipment.map((item) => (
                      <button
                        className={`equipment-slot ${item.cls}`}
                        key={item.cls}
                        title="클릭해서 새 장비 비교"
                        onClick={() => setCompareReady(true)}
                      >
                        <span>{item.label}</span>
                        {item.sub && <small>{item.sub}</small>}
                      </button>
                    ))}
                  </div>
                  <div className="jewel-wrap">
                    <div className="sub-title">BASE JEWELS</div>
                    <div className="jewel-row">
                      {jewels.map((name, idx) => (
                        <button className={`jewel j-${(idx % 4) + 1}`} key={name} title="클릭해서 새 주얼 비교">
                          <span>{name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <StatsCard title="Stats" stats={currentStats} mainSkills={mainSkills} />
              </div>
            </section>

            <section className="comparison-section">
              <section className="all-skills panel-card">
                <div className="panel-title">All Skills</div>
                <div className="skill-list">
                  {skills.map((skill, idx) => (
                    <article className="skill-row" key={`${skill.name}-${idx}`}>
                      <div className={`skill-icon ${skill.tone}`}>{skill.name.slice(0, 1)}</div>
                      <div className="skill-copy">
                        <strong>{skill.name}</strong>
                        <span>{skill.support}</span>
                      </div>
                      <b>{skill.dps}</b>
                    </article>
                  ))}
                </div>
              </section>

              <section className="comparison-note">
                <div className="compare-box">
                  <span>장비 비교</span>
                  <h2>{compareReady ? "새 장비 적용 예시" : "장비를 선택하세요"}</h2>
                  <p>
                    왼쪽 장비 또는 BASE JEWELS를 클릭하면 이 영역에서 비교 입력을 시작하게 됩니다.
                    지금은 디자인 검수용 더미 상태입니다.
                  </p>
                  <button onClick={() => setCompareReady((v) => !v)}>더미 비교 상태 전환</button>
                </div>
              </section>

              <StatsCard title="변화 후 STATS" stats={changedStats} mainSkills={mainSkills.map((s, i) => ({ ...s, dps: i === 0 ? "445k" : "9.0k" }))} changed />
            </section>
          </div>

          <aside className="ad-rail right" aria-label="우측 광고 영역">
            <div className="ad-placeholder">
              <small>ADSENSE</small>
              <strong>우측 광고 자리</strong>
            </div>
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="site-shell">
      <section className="top-strip">
        <div className="brand-panel">
          <div>
            <p className="eyebrow">PATH OF EXILE 2 · FAN-MADE TOOL</p>
            <h1>FIX <span>PoB</span></h1>
            <p className="brand-copy">
              복잡한 PoB 계산은 그대로.<br />내 캐릭터의 실전 DPS는 더 간단하게.
            </p>
          </div>
          <div className="trust-line">PoB2 Community 계산 로직 기반</div>
        </div>

        <div className="season-header" aria-label="현재 시즌 비주얼">
          <img src="/season-header.jpg" alt="Path of Exile 2 시즌 이미지" />
          <div className="season-label">CURRENT SEASON</div>
        </div>
      </section>

      <section className="hero-stage">
        <div className="tree-column">
          <div className="tree-art" aria-hidden="true" />
          <nav className="guide-panel" aria-label="가이드">
            <div className="guide-heading">
              <span>GUIDE</span>
              <strong>필요할 때만 보는 간단 가이드</strong>
            </div>
            <div className="guide-links">
              {guideLinks.map((item) => (
                <a href="#" key={item}>{item}</a>
              ))}
            </div>
          </nav>
        </div>

        <div className="content-column">
          <section className="character-panel" id="character">
            <div className="character-copy">
              <p className="panel-kicker">START</p>
              <h2>내 캐릭터 불러오기</h2>
              <p>
                GGG 계정으로 연결하면 장비·스킬·패시브를 불러와
                주력 스킬의 DPS를 간단하게 계산합니다.
              </p>
            </div>

            <div className="character-actions">
              <button type="button" onClick={() => setScreen("game")}>캐릭터 불러오기</button>
              <small>현재 시안은 더미 캐릭터로 진입합니다.</small>
            </div>

            <div className="result-preview" aria-hidden="true">
              <div><span>기본 DPS</span><b>420K</b></div>
              <div className="featured"><span>실전 DPS</span><b>1.28M</b></div>
              <div><span>최대 조건</span><b>2.04M</b></div>
            </div>
          </section>

          <section className="video-panel">
            <div className="video-head">
              <div>
                <p className="panel-kicker">OFFICIAL VIDEO</p>
                <h2>Path of Exile 2</h2>
              </div>
              <span>Grinding Gear Games 공식 YouTube</span>
            </div>

            <div className="video-frame">
              <iframe
                src="https://www.youtube.com/embed/WMo3RYyr4vY?autoplay=1&mute=1&loop=1&playlist=WMo3RYyr4vY&rel=0&playsinline=1"
                title="Path of Exile 2 official video"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        </div>
      </section>

      <footer>
        <a href="/"><strong>← FIX POE2</strong></a>
        <span>FIX PoB · Unofficial fan-made tool. Not affiliated with or endorsed by Grinding Gear Games.</span>
      </footer>
    </main>
  );
}

function StatsCard({
  title,
  stats,
  mainSkills,
  changed = false,
}: {
  title: string;
  stats: string[][];
  mainSkills: { name: string; support: string; dps: string; tone: string }[];
  changed?: boolean;
}) {
  return (
    <section className={`stats-card panel-card ${changed ? "changed" : ""}`}>
      <div className="panel-title">{title}</div>
      <div className="stats-scroll">
        <div className="stat-group-label">CHARACTER</div>
        {stats.slice(0, 4).map(([name, value, cls]) => <StatRow key={name} name={name} value={value} cls={cls} />)}
        <div className="stat-group-label">DEFENSIVE</div>
        {stats.slice(4, 18).map(([name, value, cls]) => <StatRow key={name} name={name} value={value} cls={cls} />)}
        <div className="stat-group-label">RECOVERY</div>
        {stats.slice(18).map(([name, value, cls]) => <StatRow key={name} name={name} value={value} cls={cls} />)}
      </div>
      <div className="main-skills-block">
        <div className="stat-group-label">MAIN SKILLS</div>
        {mainSkills.map((skill) => (
          <div className="main-skill" key={skill.name}>
            <div className={`skill-icon ${skill.tone}`}>{skill.name.slice(0, 1)}</div>
            <div>
              <strong>{skill.name}</strong>
              <span>{skill.support}</span>
            </div>
            <b>{skill.dps}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatRow({ name, value, cls }: { name: string; value: string; cls?: string }) {
  return (
    <div className={`stat-row ${cls || ""}`}>
      <span>{name}</span>
      <b>{value}</b>
    </div>
  );
}
