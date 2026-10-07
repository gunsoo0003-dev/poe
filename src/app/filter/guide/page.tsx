import Link from "next/link";

export default function FilterGuidePage() {
  return (
    <main className="filter-guide-page">
      <header className="filter-guide-topbar">
        <Link className="filter-guide-brand" href="/">FIX POE2</Link>
        <Link className="filter-guide-back-top" href="/filter">← 필터로 돌아가기</Link>
      </header>

      <article className="filter-guide-shell">
        <div className="filter-guide-kicker">FIX POE2 · FILTER GUIDE</div>
        <h1>처음 오셨나요?<br />이것만 알면 바로 쓸 수 있습니다.</h1>
        <p className="filter-guide-lead">
          FIX POE2 필터는 NeverSink 0~6단계를 그대로 기반으로 두고,
          필요한 항목만 쉽게 바꿔서 저장하는 커스텀 도구입니다.
        </p>

        <section className="filter-guide-summary" aria-label="핵심 요약">
          <div><span>원본</span><strong>현재 단계 초기화</strong></div>
          <div><span>NS</span><strong>NeverSink 그대로</strong></div>
          <div><span>현재 필터 저장</span><strong>게임에 적용</strong></div>
        </section>

        <section className="filter-guide-step">
          <em>01</em>
          <div>
            <h2>먼저 필터 단계를 선택하세요</h2>
            <p>왼쪽 위에서 NeverSink 0-SOFT부터 6-UBER PLUS STRICT까지 선택할 수 있습니다. 숫자가 높아질수록 불필요한 드롭이 더 많이 숨겨집니다.</p>
            <p>각 단계는 따로 커스텀해서 사용할 수 있습니다. 예를 들어 2단계는 아이템을 많이 보고 싶을 때, 5단계는 일반 사냥용처럼 나눠 둘 수 있습니다.</p>
          </div>
        </section>

        <section className="filter-guide-step">
          <em>02</em>
          <div>
            <h2>원본 = 해당 NeverSink 단계로 초기화</h2>
            <p>설정을 많이 바꿨다가 처음부터 다시 시작하고 싶다면 <b>원본</b>을 선택하세요. 현재 선택한 단계의 NeverSink 기본 상태로 돌아갑니다.</p>
          </div>
        </section>

        <section className="filter-guide-step">
          <em>03</em>
          <div>
            <h2>NS = NeverSink 원래 설정 유지</h2>
            <p><b>NS</b>는 NeverSink 기본 중요도와 스타일을 그대로 사용한다는 뜻입니다. 별도로 바꾸지 않은 항목은 원본 NeverSink 동작을 유지합니다.</p>
          </div>
        </section>

        <section className="filter-guide-step">
          <em>04</em>
          <div>
            <h2>원하는 것만 바꾸면 됩니다</h2>
            <p>체크를 끄면 숨기고, 중요도를 바꾸면 표시 강도와 스타일을 바꿀 수 있습니다. 모든 항목을 처음부터 손댈 필요는 없습니다.</p>
            <p>아이템이 너무 많이 보인다면 레어·매직 장비부터 높은 등급만 남겨 보는 방식이 가장 간단합니다.</p>
          </div>
        </section>

        <section className="filter-guide-step">
          <em>05</em>
          <div>
            <h2>사운드도 바로 바꿀 수 있습니다</h2>
            <p>원하는 드롭에 사이트 제공 사운드 또는 개인 커스텀 사운드를 지정할 수 있습니다. 사운드를 바꾼 뒤에도 마지막에는 현재 필터를 저장해야 게임에 반영됩니다.</p>
          </div>
        </section>

        <section className="filter-guide-step is-important">
          <em>06</em>
          <div>
            <h2>마지막에는 반드시 ‘현재 필터 저장’</h2>
            <p>체크, 중요도, 사운드를 바꾼 뒤 <b>현재 필터 저장</b>을 누르면 지금 만든 필터가 게임 필터 폴더에 저장·적용됩니다.</p>
            <p>처음 사용할 때만 Path of Exile 2 필터 폴더를 선택하면 되고, 이후에는 같은 폴더에 바로 저장할 수 있습니다.</p>
          </div>
        </section>

        <section className="filter-guide-tip">
          <strong>처음이라면 이렇게 시작해보세요</strong>
          <p>현재 사용하는 NeverSink 단계를 원본으로 불러온 뒤, 불필요한 항목 몇 개만 숨겨 보세요. 익숙해지면 중요도와 사운드를 하나씩 조정하면 됩니다.</p>
        </section>

        <Link className="filter-guide-back" href="/filter">← 필터 화면으로 돌아가기</Link>
      </article>
    </main>
  );
}
