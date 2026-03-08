import './style.css'
import { getExactReignLabel, getMonarchBio, getMonarchExactReigns } from './content'
import { housePeriods, monarchs, WORLD_END_YEAR, WORLD_START_YEAR, type HousePeriod, type Monarch, type ReignRange } from './data'

type ViewState = {
  start: number
  end: number
}

type CardMode = 'full' | 'compact' | 'badge'

type CardPlacement = {
  monarch: Monarch
  center: number
  lane: number
  stack: number
  mode: CardMode
}

type EventPlacement = {
  id: string
  year: number
  label: string
  detail?: string
  lane: number
  showLabel: boolean
  monarchName: string
}

type AppState = {
  discovered: Set<string>
  inputValue: string
  status: string
  startedAt: number
  completedAt: number | null
  view: ViewState
  recentMonarchId: string | null
  selectedMonarchId: string | null
  portraitUrls: Map<string, string>
}

const WORLD_SPAN = WORLD_END_YEAR - WORLD_START_YEAR
const MIN_VIEW_SPAN = 8
const eventLanes = 4
const eventExplainers: Record<string, string> = {
  hastings: 'William won a huge battle and became king of England.',
  domesday: 'This was a giant survey showing who owned land and animals.',
  'new-forest': 'William II was shot while hunting in the forest.',
  'white-ship': 'Henry’s son drowned, so the kingdom had no clear next king.',
  treasury: 'Royal money records were written down very carefully.',
  anarchy: 'People fought over who should rule, and life became unsafe.',
  'lady-of-english': 'Matilda was accepted by some people as the ruler.',
  becket: 'Thomas Becket was killed after arguing with Henry about power.',
  ireland: 'Henry went to Ireland to show he was in charge there too.',
  'third-crusade': 'Richard fought far away in a famous holy war.',
  lionheart: 'People remembered Richard as a brave fighting king.',
  'magna-carta': 'The king had to promise not to be unfair or too powerful.',
  'barons-war': 'Powerful lords fought King John over how he ruled.',
  montfort: 'Important people met to help choose how the country should be run.',
  'westminster-abbey': 'Henry rebuilt the great church we still know today.',
  wales: 'Edward took control of Wales and changed how it was ruled.',
  'model-parliament': 'This meeting helped shape the future Parliament.',
  bannockburn: 'Scotland won a famous battle against Edward II.',
  'hundred-years-war': 'Edward won big battles in a long war with France.',
  'black-death': 'A terrible sickness killed many people across the country.',
  'peasants-revolt': 'Poor people rose up because life felt unfair.',
  deposed: 'Richard lost his crown and was forced off the throne.',
  deposition: 'Henry took the crown from Richard II.',
  agincourt: 'Henry V won a famous battle against France.',
  troyes: 'This treaty said Henry V would inherit the French crown.',
  'wars-of-roses': 'Two royal families fought over who should be king.',
  madness: 'Henry VI became very ill in his mind and could not rule well.',
  towton: 'Edward IV won a huge battle and became king.',
  tewkesbury: 'Edward IV beat his enemies and won back the throne.',
  'princes-tower': 'Edward V was one of two princes who vanished in the Tower.',
  'princes-r3': 'The missing princes are strongly linked with Richard III.',
  bosworth: 'Richard III lost this battle and the Tudors took over.',
  'bosworth-h7': 'Henry VII won the crown by beating Richard III in battle.',
  'tudor-rose': 'This marriage joined two fighting families together.',
  'break-rome': 'Henry VIII split England’s church away from the Pope.',
  dissolution: 'Monasteries were closed and their lands were taken.',
  'prayer-book': 'A new church book changed how services were held.',
  somerset: 'People rebelled because changes made life harder.',
  'nine-days': 'Jane was queen only for a very short time.',
  'bloody-mary': 'Mary punished Protestants by burning many of them.',
  calais: 'England lost its last piece of land in France.',
  armada: 'England stopped Spain’s great fleet from invading.',
  'mary-queen-scots': 'Elizabeth had her rival Mary put to death.',
  gunpowder: 'A plot tried to blow up the king and Parliament.',
  'king-james-bible': 'A famous English Bible was made in James’s time.',
  'civil-war': 'The king and Parliament fought over who had power.',
  'execution-c1': 'Charles I was put to death after the war.',
  restoration: 'The monarchy came back after years without a king.',
  'great-fire': 'A huge fire burned much of London.',
  'glorious-revolution': 'James II was pushed out and new rulers were chosen.',
  'glorious-revolution-w3': 'William came to power in the Glorious Revolution.',
  boyne: 'William won a key battle in Ireland.',
  'joint-rule': 'Mary and William ruled together as king and queen.',
  union: 'England and Scotland joined to make Great Britain.',
  marlborough: 'British armies won famous battles in Anne’s time.',
  'jacobite-1715': 'Supporters of the old royal family tried to take back the crown.',
  'jacobite-1745': 'Bonnie Prince Charlie tried to win the throne.',
  'american-independence': 'Britain lost control of the American colonies.',
  napoleon: 'Britain helped defeat Napoleon at Waterloo.',
  regency: 'George was too ill to rule, so his son ruled for him.',
  'reform-act': 'More people got a say in choosing Members of Parliament.',
  'great-exhibition': 'Britain showed off inventions and goods from around the world.',
  jubilee: 'People celebrated Victoria’s long time on the throne.',
  'edwardian-age': 'This began a stylish new period before the First World War.',
  'first-world-war': 'Britain entered a huge war fought across the world.',
  'windsor-name': 'The royal family changed its name to Windsor.',
  abdication: 'Edward VIII gave up the throne to marry Wallis Simpson.',
  'second-world-war': 'Britain went to war again against Nazi Germany.',
  blitz: 'German bombing badly damaged British towns and cities.',
  'televised-coronation': 'Millions watched the coronation live on television.',
  'platinum-jubilee': 'People celebrated 70 years of Elizabeth II as queen.',
  'accession-c3': 'Charles became king when Queen Elizabeth II died.',
  'coronation-2023': 'Charles was crowned in a grand ceremony at Westminster Abbey.',
}

const aliasMap = buildAliasMap(monarchs)
const monarchById = new Map(monarchs.map((monarch) => [monarch.id, monarch]))
const houseColorMap = new Map(housePeriods.map((house) => [house.label, house.color]))
const monarchLanes = assignMonarchLanes(monarchs)

const state: AppState = {
  discovered: new Set(),
  inputValue: '',
  status: 'Type a monarch to reveal them on the timeline.',
  startedAt: Date.now(),
  completedAt: null,
  view: { start: WORLD_START_YEAR, end: WORLD_END_YEAR },
  recentMonarchId: null,
  selectedMonarchId: null,
  portraitUrls: new Map(),
}

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root was not found.')
}

app.innerHTML = `
  <main class="app-shell">
    <section class="hero">
      <div class="hero__copy">
        <p class="eyebrow">1050 to today</p>
        <h1>Monarchs of England, Great Britain, and the United Kingdom</h1>
      </div>
      <div class="summary-grid">
        <article class="stat-card">
          <span class="stat-card__label">Progress</span>
          <strong id="progress-value" class="stat-card__value">0 / ${monarchs.length}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-card__label">Elapsed</span>
          <strong id="timer-value" class="stat-card__value">00:00</strong>
        </article>
        <article class="stat-card">
          <span class="stat-card__label">Visible span</span>
          <strong id="view-value" class="stat-card__value">${Math.round(WORLD_SPAN)} years</strong>
        </article>
      </div>
    </section>

    <section class="controls">
      <label class="answer-box" for="answer-input">
        <span class="answer-box__label">Answer box</span>
        <input
          id="answer-input"
          class="answer-box__input"
          type="text"
          autocomplete="off"
          autocapitalize="words"
          spellcheck="false"
          placeholder="Type a monarch name..."
        />
      </label>
      <div class="control-cluster">
        <button id="reveal-all" class="control-button" type="button">Complete quiz</button>
        <button id="zoom-out" class="control-button" type="button">Zoom out</button>
        <button id="zoom-in" class="control-button" type="button">Zoom in</button>
        <button id="zoom-reset" class="control-button control-button--strong" type="button">Reset view</button>
      </div>
    </section>

    <p id="status-text" class="status-text"></p>

    <section class="timeline-panel">
      <div id="timeline-viewport" class="timeline-viewport" aria-label="Zoomable monarch timeline"></div>
      <section id="monarch-info" class="monarch-info" aria-live="polite"></section>
    </section>

    <section class="sources">
      <p>
        <strong>Reign data:</strong>
        <a href="https://www.royal.uk/kings-and-queens-1066" target="_blank" rel="noreferrer">Kings and Queens from 1066</a>,
        plus official pages for
        <a href="https://www.royal.uk/encyclopedia/queen-elizabeth-ii" target="_blank" rel="noreferrer">Elizabeth II</a>
        and
        <a href="https://www.royal.uk/100-coronation-facts" target="_blank" rel="noreferrer">Charles III</a>.
      </p>
      <p><strong>Portraits:</strong> downloaded from Wikimedia sources into this project, with a monogram fallback for any missing image.</p>
    </section>
  </main>
`

const answerInput = document.querySelector<HTMLInputElement>('#answer-input')
const progressValue = document.querySelector<HTMLElement>('#progress-value')
const timerValue = document.querySelector<HTMLElement>('#timer-value')
const viewValue = document.querySelector<HTMLElement>('#view-value')
const statusText = document.querySelector<HTMLElement>('#status-text')
const timelineViewport = document.querySelector<HTMLDivElement>('#timeline-viewport')
const monarchInfo = document.querySelector<HTMLElement>('#monarch-info')
const revealAllButton = document.querySelector<HTMLButtonElement>('#reveal-all')
const zoomInButton = document.querySelector<HTMLButtonElement>('#zoom-in')
const zoomOutButton = document.querySelector<HTMLButtonElement>('#zoom-out')
const zoomResetButton = document.querySelector<HTMLButtonElement>('#zoom-reset')

if (!answerInput || !progressValue || !timerValue || !viewValue || !statusText || !timelineViewport || !monarchInfo || !revealAllButton || !zoomInButton || !zoomOutButton || !zoomResetButton) {
  throw new Error('Failed to bind required UI elements.')
}

const boundAnswerInput = answerInput
const boundProgressValue = progressValue
const boundTimerValue = timerValue
const boundViewValue = viewValue
const boundStatusText = statusText
const boundTimelineViewport = timelineViewport
const boundMonarchInfo = monarchInfo
const boundRevealAllButton = revealAllButton
const boundZoomInButton = zoomInButton
const boundZoomOutButton = zoomOutButton
const boundZoomResetButton = zoomResetButton

boundAnswerInput.addEventListener('input', (event) => {
  state.inputValue = event.currentTarget instanceof HTMLInputElement ? event.currentTarget.value : ''
  tryResolveAnswer()
  render()
})

boundRevealAllButton.addEventListener('click', () => {
  revealAllMonarchs()
})

boundZoomInButton.addEventListener('click', () => zoomAround(0.7))
boundZoomOutButton.addEventListener('click', () => zoomAround(1.35))
boundZoomResetButton.addEventListener('click', () => {
  state.status = 'Timeline reset to the full 1066 to present span.'
  animateViewTo(WORLD_START_YEAR, WORLD_END_YEAR)
})

bindViewportInteractions(boundTimelineViewport)
bindMonarchSelection(boundTimelineViewport)

window.setInterval(() => {
  renderSummary()
}, 1000)

void loadPortraitManifest()

render()
boundAnswerInput.focus()

function render(): void {
  renderSummary()
  boundStatusText.textContent = state.status
  boundTimelineViewport.innerHTML = renderTimeline()
  boundMonarchInfo.innerHTML = renderMonarchInfo()
}

function renderSummary(): void {
  const foundCount = state.discovered.size
  boundProgressValue.textContent = `${foundCount} / ${monarchs.length}`

  const endTime = state.completedAt ?? Date.now()
  boundTimerValue.textContent = formatElapsed(endTime - state.startedAt)

  const span = state.view.end - state.view.start
  boundViewValue.textContent = `${formatYears(span)} visible`
}

function renderTimeline(): string {
  const viewSpan = state.view.end - state.view.start
  const housesHtml = renderHouses(housePeriods)
  const segmentsHtml = renderMonarchSegments(monarchs)
  const cardsHtml = renderMonarchCards(monarchs)
  const ticksHtml = renderAxisTicks()
  const eventsHtml = renderEvents(monarchs)

  return `
    <div class="timeline-stage">
      <div class="timeline-stage__houses">${housesHtml}</div>
      <div class="timeline-stage__monarchs">${segmentsHtml}${cardsHtml}</div>
      <div class="timeline-stage__axis">
        <div class="timeline-axis-line"></div>
        ${ticksHtml}
      </div>
      <div class="timeline-stage__events">${eventsHtml}</div>
      <div class="timeline-stage__legend">
        <span><i class="legend-swatch legend-swatch--found"></i> Answered monarch</span>
        <span><i class="legend-swatch legend-swatch--ghost"></i> Unrevealed reign</span>
        <span><i class="legend-dot"></i> Key event</span>
        <span>${Math.round(viewSpan)} year window</span>
      </div>
    </div>
  `
}

function renderHouses(periods: HousePeriod[]): string {
  return periods
    .filter((period) => overlaps(period.start, period.end, state.view.start, state.view.end))
    .map((period) => {
      const metrics = getMetrics(period.start, period.end)
      if (!metrics) return ''

      const labelVisible = metrics.widthPx > 90
      return `
        <div
          class="house-band"
          style="left:${metrics.leftPct}%; width:${metrics.widthPct}%; --house-color:${period.color};"
          title="${period.label}"
        >
          ${labelVisible ? `<span>${period.label}</span>` : ''}
        </div>
      `
    })
    .join('')
}

function renderMonarchSegments(items: Monarch[]): string {
  return items
    .map((monarch) => {
      const lane = monarchLanes.get(monarch.id) ?? 0
      return monarch.reigns
        .map((reign, reignIndex) => ({ reign, reignIndex }))
        .filter(({ reign }) => overlaps(reign.start, reign.end, state.view.start, state.view.end))
        .map(({ reign, reignIndex }) => renderSegment(monarch, reign, reignIndex, lane))
        .join('')
    })
    .join('')
}

function renderSegment(monarch: Monarch, reign: ReignRange, reignIndex: number, lane: number): string {
  const metrics = getMetrics(reign.start, reign.end)
  if (!metrics) return ''

  const revealed = state.discovered.has(monarch.id)
  const recent = state.recentMonarchId === monarch.id
  const houseColor = houseColorMap.get(monarch.house) ?? '#6c4b3a'
  const top = 344 + lane * 16
  const exactDates = getExactReignLabel(monarch.id, reignIndex, reign)

  return `
    <div
      class="reign-segment ${revealed ? 'reign-segment--found' : 'reign-segment--ghost'} ${recent ? 'reign-segment--recent' : ''}"
      style="left:${metrics.leftPct}%; width:${Math.max(metrics.widthPct, 0.35)}%; top:${top}px; --segment-color:${houseColor};"
      title="${monarch.name}: ${exactDates}"
      tabindex="0"
      aria-label="${monarch.name}: ${exactDates}"
    >
      <span class="reign-segment__tooltip">
        <strong>${monarch.name}</strong>
        <span>${exactDates}</span>
      </span>
    </div>
  `
}

function renderMonarchCards(items: Monarch[]): string {
  const visibleFound = items
    .filter((monarch) => state.discovered.has(monarch.id))
    .map((monarch) => {
      const metrics = getBestVisibleCardMetrics(monarch)
      if (!metrics) return null

      const widthPx = Math.max(metrics.widthPx, 18)
      const baseMode = getCardMode(widthPx, monarch.id === state.recentMonarchId)
      if (!baseMode) return null

      return {
        monarch,
        center: metrics.leftPct + metrics.widthPct / 2,
        centerPx: metrics.leftPx + metrics.widthPx / 2,
        lane: monarchLanes.get(monarch.id) ?? 0,
        widthPx,
        mode: baseMode,
      }
    })
    .filter((placement): placement is NonNullable<typeof placement> => placement !== null)

  const placed = resolveCardCollisions(visibleFound)

  return placed
    .map((placement) => {
      const imageUrl = state.portraitUrls.get(placement.monarch.id)
      const recent = placement.monarch.id === state.recentMonarchId
      const top = 14 + placement.lane * 34 + placement.stack * 116
      const width = placement.mode === 'full' ? 148 : placement.mode === 'compact' ? 114 : 44
      const imageVisible = placement.mode !== 'badge'
      const dateVisible = placement.mode !== 'badge'

      return `
        <article
          class="monarch-card monarch-card--${placement.mode} ${recent ? 'monarch-card--recent' : ''}"
          style="left:${placement.center}%; top:${top}px; width:${width}px;"
          title="${placement.monarch.name}: ${placement.monarch.dateLabel}"
          tabindex="0"
          role="button"
          data-monarch-id="${placement.monarch.id}"
          aria-label="Open details for ${placement.monarch.name}"
        >
          <div class="monarch-card__portrait">
            ${
              imageVisible && imageUrl
                ? `<img src="${imageUrl}" alt="${placement.monarch.name}" loading="lazy" />`
                : `<span>${placement.monarch.portraitFallback}</span>`
            }
          </div>
          ${
            placement.mode === 'badge'
              ? ''
              : `
                <div class="monarch-card__text">
                  <strong>${placement.monarch.name}</strong>
                  ${dateVisible ? `<span>${placement.monarch.dateLabel}</span>` : ''}
                </div>
              `
          }
        </article>
      `
    })
    .join('')
}

function renderMonarchInfo(): string {
  const monarch = state.selectedMonarchId ? monarchById.get(state.selectedMonarchId) : null

  if (!monarch || !state.discovered.has(monarch.id)) {
    return `
      <div class="monarch-info__empty">
        <strong>Monarch details</strong>
        <span>Click a revealed monarch on the timeline to open a larger portrait and a short description here.</span>
      </div>
    `
  }

  const portraitUrl = state.portraitUrls.get(monarch.id)
  const exactReigns = getMonarchExactReigns(monarch)

  return `
    <article class="monarch-info__card">
      <button class="monarch-info__close" type="button" data-close-monarch-info="true" aria-label="Close monarch details">Close</button>
      <div class="monarch-info__media">
        ${
          portraitUrl
            ? `<img src="${portraitUrl}" alt="${monarch.name}" loading="lazy" />`
            : `<div class="monarch-info__fallback">${monarch.portraitFallback}</div>`
        }
      </div>
      <div class="monarch-info__body">
        <p class="monarch-info__eyebrow">${monarch.house}</p>
        <h3>${monarch.name}</h3>
        <p class="monarch-info__dates">${monarch.dateLabel}</p>
        <p class="monarch-info__bio">${getMonarchBio(monarch)}</p>
        <div class="monarch-info__facts">
          <strong>Exact reign dates</strong>
          ${exactReigns.map((reign) => `<span>${reign}</span>`).join('')}
        </div>
      </div>
    </article>
  `
}

function renderAxisTicks(): string {
  const step = getTickStep(state.view.end - state.view.start)
  const firstTick = Math.ceil(state.view.start / step) * step
  const ticks: string[] = []

  for (let year = firstTick; year < state.view.end; year += step) {
    const x = percentFromYear(year)
    ticks.push(`
      <div class="axis-tick" style="left:${x}%;">
        <span>${year}</span>
      </div>
    `)
  }

  return ticks.join('')
}

function renderEvents(items: Monarch[]): string {
  const maxEventsPerMonarch = getVisibleEventLimitPerMonarch(state.view.end - state.view.start)

  const allEvents = items.flatMap((monarch) =>
    monarch.events.slice(0, maxEventsPerMonarch).map((event) => ({
      id: event.id,
      year: event.year,
      label: event.label,
      detail: getEventExplanation(event.id, event.label, monarch.name, event.detail),
      monarchName: monarch.name,
    })),
  )

  const placements = placeEvents(allEvents)

  return placements
    .map((event) => {
      const x = percentFromYear(event.year)
      const top = 24 + event.lane * 44
      return `
        <div
          class="timeline-event ${event.showLabel ? '' : 'timeline-event--dot-only'}"
          style="left:${x}%; top:${top}px;"
          title="${event.year}: ${event.label} (${event.monarchName})"
          tabindex="0"
          aria-label="${event.year}: ${event.label}. ${event.detail ?? ''}"
        >
          <div class="timeline-event__marker"></div>
          ${
            event.showLabel
              ? `
                <div class="timeline-event__label">
                  <strong>${event.year}</strong>
                  <span>${event.label}</span>
                </div>
              `
              : ''
          }
          <div class="timeline-event__tooltip">
            <strong>${event.year} · ${event.label}</strong>
            <span>${event.detail ?? ''}</span>
          </div>
        </div>
      `
    })
    .join('')
}

function tryResolveAnswer(): void {
  const normalized = normalizeAnswer(state.inputValue)
  if (!normalized) return

  const matchId = aliasMap.get(normalized)
  if (!matchId) return
  if (state.discovered.has(matchId)) return

  const monarch = monarchById.get(matchId)
  if (!monarch) return

  state.discovered.add(matchId)
  state.recentMonarchId = matchId
  state.status = `${monarch.name} accepted. ${state.discovered.size} of ${monarchs.length} found.`
  state.inputValue = ''
  boundAnswerInput.value = ''
  zoomToMonarch(monarch)

  if (state.discovered.size === monarchs.length) {
    state.completedAt = Date.now()
    state.status = `Complete in ${formatElapsed(state.completedAt - state.startedAt)}. All ${monarchs.length} monarchs revealed.`
  }
}

function revealAllMonarchs(): void {
  state.discovered = new Set(monarchs.map((monarch) => monarch.id))
  state.recentMonarchId = null

  if (!state.completedAt) {
    state.completedAt = Date.now()
  }

  state.status = `All ${monarchs.length} monarchs revealed for timeline review.`

  render()
}

function zoomToMonarch(monarch: Monarch): void {
  const start = Math.min(...monarch.reigns.map((reign) => reign.start))
  const end = Math.max(...monarch.reigns.map((reign) => reign.end))
  const span = clamp((end - start) * 2.6, MIN_VIEW_SPAN, 90)
  const center = (start + end) / 2
  animateViewTo(center - span / 2, center + span / 2)
}

function zoomAround(factor: number, focalPoint = 0.5): void {
  const currentSpan = state.view.end - state.view.start
  const nextSpan = clamp(currentSpan * factor, MIN_VIEW_SPAN, WORLD_SPAN)
  const focusYear = state.view.start + currentSpan * focalPoint
  const nextStart = focusYear - nextSpan * focalPoint
  setView(nextStart, nextStart + nextSpan)
}

function animateViewTo(start: number, end: number): void {
  const from = { ...state.view }
  const target = sanitizeView(start, end)
  const startedAt = performance.now()
  const duration = 520

  const step = (now: number) => {
    const progress = clamp((now - startedAt) / duration, 0, 1)
    const eased = 1 - (1 - progress) * (1 - progress) * (1 - progress)

    state.view = {
      start: from.start + (target.start - from.start) * eased,
      end: from.end + (target.end - from.end) * eased,
    }
    render()

    if (progress < 1) {
      requestAnimationFrame(step)
    }
  }

  requestAnimationFrame(step)
}

function setView(start: number, end: number): void {
  state.view = sanitizeView(start, end)
  render()
}

function sanitizeView(start: number, end: number): ViewState {
  const span = clamp(end - start, MIN_VIEW_SPAN, WORLD_SPAN)
  const boundedStart = clamp(start, WORLD_START_YEAR, WORLD_END_YEAR - span)
  return {
    start: boundedStart,
    end: boundedStart + span,
  }
}

function getMetrics(start: number, end: number): { leftPct: number; widthPct: number; leftPx: number; widthPx: number } | null {
  const clippedStart = Math.max(start, state.view.start)
  const clippedEnd = Math.min(end, state.view.end)

  if (clippedEnd <= clippedStart) {
    return null
  }

  const leftPct = ((clippedStart - state.view.start) / (state.view.end - state.view.start)) * 100
  const widthPct = ((clippedEnd - clippedStart) / (state.view.end - state.view.start)) * 100
  const leftPx = (leftPct / 100) * boundTimelineViewport.clientWidth
  const widthPx = (widthPct / 100) * boundTimelineViewport.clientWidth

  return { leftPct, widthPct, leftPx, widthPx }
}

function percentFromYear(year: number): number {
  return ((year - state.view.start) / (state.view.end - state.view.start)) * 100
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return endA > startB && startA < endB
}

function getCardMode(widthPx: number, isRecent: boolean): CardMode | null {
  if (widthPx >= 110) return 'full'
  if (widthPx >= 56 || isRecent) return 'compact'
  if (widthPx >= 10) return 'badge'
  return null
}

function resolveCardCollisions(
  placements: Array<{ monarch: Monarch; center: number; centerPx: number; lane: number; widthPx: number; mode: CardMode }>,
): CardPlacement[] {
  const lanes = new Map<number, typeof placements>()

  for (const placement of placements) {
    const laneItems = lanes.get(placement.lane) ?? []
    laneItems.push(placement)
    lanes.set(placement.lane, laneItems)
  }

  const resolved: CardPlacement[] = []

  for (const [lane, lanePlacements] of lanes) {
    lanePlacements.sort((left, right) => left.centerPx - right.centerPx)
    const stackEnds = [-Infinity, -Infinity, -Infinity]

    for (const candidate of lanePlacements) {
      let mode: CardMode | null = candidate.mode

      while (mode) {
        const width = getCardFootprint(mode).width
        const leftEdge = candidate.centerPx - width / 2
        const rightEdge = candidate.centerPx + width / 2
        const availableStack = stackEnds.findIndex((nextFree) => leftEdge >= nextFree)

        if (availableStack !== -1) {
          resolved.push({ monarch: candidate.monarch, center: candidate.center, lane, stack: availableStack, mode })
          stackEnds[availableStack] = rightEdge + 12
          break
        }

        mode = downgradeMode(mode, candidate.monarch.id === state.recentMonarchId)
      }
    }
  }

  return resolved
}

function downgradeMode(mode: CardMode, isRecent: boolean): CardMode | null {
  if (mode === 'full') return 'compact'
  if (mode === 'compact') return isRecent ? 'badge' : 'badge'
  return null
}

function getCardFootprint(mode: CardMode): { width: number; height: number } {
  if (mode === 'full') return { width: 148, height: 104 }
  if (mode === 'compact') return { width: 114, height: 88 }
  return { width: 44, height: 44 }
}

function getBestVisibleCardMetrics(monarch: Monarch): { leftPct: number; widthPct: number; leftPx: number; widthPx: number } | null {
  const visibleReigns = monarch.reigns
    .map((reign) => getMetrics(reign.start, reign.end))
    .filter((metrics): metrics is NonNullable<typeof metrics> => metrics !== null)

  if (visibleReigns.length === 0) {
    return null
  }

  return visibleReigns.reduce((best, current) => {
    if (current.widthPx > best.widthPx) return current

    const bestCenterDistance = Math.abs(best.leftPx + best.widthPx / 2 - boundTimelineViewport.clientWidth / 2)
    const currentCenterDistance = Math.abs(current.leftPx + current.widthPx / 2 - boundTimelineViewport.clientWidth / 2)
    return currentCenterDistance < bestCenterDistance ? current : best
  })
}

function placeEvents(
  events: Array<{ id: string; year: number; label: string; detail?: string; monarchName: string }>,
): EventPlacement[] {
  const visible = events
    .filter((event) => event.year >= state.view.start && event.year <= state.view.end)
    .sort((left, right) => left.year - right.year)

  const laneEnds = new Array<number>(eventLanes).fill(-Infinity)
  const placements: EventPlacement[] = []

  for (const event of visible) {
    const labelWidth = estimateEventWidth(event.label)
    const xPx = (percentFromYear(event.year) / 100) * boundTimelineViewport.clientWidth
    let lane = 0
    let showLabel = false

    for (let index = 0; index < eventLanes; index += 1) {
      if (xPx - labelWidth / 2 >= laneEnds[index]) {
        lane = index
        showLabel = true
        laneEnds[index] = xPx + labelWidth / 2 + 12
        break
      }
    }

    if (!showLabel) {
      lane = placements.length % eventLanes
    }

    placements.push({
      id: event.id,
      year: event.year,
      label: event.label,
      detail: event.detail,
      lane,
      showLabel,
      monarchName: event.monarchName,
    })
  }

  return placements
}

function estimateEventWidth(label: string): number {
  const densityPenalty = state.view.end - state.view.start > 180 ? 1.45 : state.view.end - state.view.start > 90 ? 1.15 : 1
  return Math.max(118, label.length * 6.4 * densityPenalty)
}

function getTickStep(span: number): number {
  if (span <= 16) return 1
  if (span <= 40) return 2
  if (span <= 80) return 5
  if (span <= 160) return 10
  if (span <= 260) return 20
  return 50
}

function getVisibleEventLimitPerMonarch(span: number): number {
  if (span <= 70) return 2
  return 1
}

function getEventExplanation(id: string, label: string, monarchName: string, explicitDetail?: string): string {
  if (explicitDetail) return explicitDetail
  return eventExplainers[id] ?? `${label} was an important thing people remember from ${monarchName}'s time.`
}

function buildAliasMap(items: Monarch[]): Map<string, string> {
  const map = new Map<string, string>()

  for (const monarch of items) {
    const aliases = new Set<string>([
      ...monarch.aliases,
      ...buildStandardAliases(monarch.name),
    ])

    for (const alias of aliases) {
      const normalized = normalizeAnswer(alias)
      if (!normalized || map.has(normalized)) continue
      map.set(normalized, monarch.id)
    }
  }

  return map
}

function buildStandardAliases(name: string): string[] {
  const aliases = new Set<string>()
  aliases.add(name)

  const numeralMatch = name.match(/\b([IVX]+)\b/)
  if (numeralMatch) {
    const roman = numeralMatch[1]
    const arabic = romanToInt(roman)
    const plain = name.replace(roman, String(arabic))
    aliases.add(plain)

    const stripped = name.replace(/\b(I|V|X)+\b/, '').replace(/\s+/g, ' ').trim()
    aliases.add(`king ${name}`)
    aliases.add(`queen ${name}`)
    aliases.add(`king ${plain}`)
    aliases.add(`queen ${plain}`)
    aliases.add(`${stripped} ${roman}`)
    aliases.add(`${stripped} ${arabic}`)
  } else {
    aliases.add(`king ${name}`)
    aliases.add(`queen ${name}`)
  }

  return [...aliases]
}

function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function romanToInt(roman: string): number {
  const values: Record<string, number> = { i: 1, v: 5, x: 10 }
  let total = 0
  let previous = 0

  for (const char of roman.toLowerCase().split('').reverse()) {
    const value = values[char] ?? 0
    if (value < previous) {
      total -= value
    } else {
      total += value
      previous = value
    }
  }

  return total
}

function assignMonarchLanes(items: Monarch[]): Map<string, number> {
  const sorted = [...items].sort((left, right) => getMonarchStart(left) - getMonarchStart(right))
  const laneEnds: number[] = []
  const map = new Map<string, number>()

  for (const monarch of sorted) {
    const start = getMonarchStart(monarch)
    const end = getMonarchEnd(monarch)
    let lane = laneEnds.findIndex((laneEnd) => laneEnd < start)

    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[lane] = end
    }

    map.set(monarch.id, lane)
  }

  return map
}

function getMonarchStart(monarch: Monarch): number {
  return Math.min(...monarch.reigns.map((reign) => reign.start))
}

function getMonarchEnd(monarch: Monarch): number {
  return Math.max(...monarch.reigns.map((reign) => reign.end))
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatYears(value: number): string {
  if (value < 10) return `${value.toFixed(1)} years`
  return `${Math.round(value)} years`
}

async function loadPortraitManifest(): Promise<void> {
  try {
    const response = await fetch('/portraits/manifest.json')
    if (!response.ok) return

    const manifest = (await response.json()) as Record<string, string>

    state.portraitUrls = new Map(Object.entries(manifest))
    render()
  } catch {
    // Local portraits are optional at startup; initials remain as fallback.
  }
}

function bindMonarchSelection(viewport: HTMLDivElement): void {
  viewport.addEventListener('click', (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('.monarch-card[data-monarch-id]') : null
    if (!target) return

    const monarchId = target.dataset.monarchId
    if (!monarchId || !state.discovered.has(monarchId)) return

    state.selectedMonarchId = monarchId
    render()
  })

  viewport.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('.monarch-card[data-monarch-id]') : null
    if (!target) return

    const monarchId = target.dataset.monarchId
    if (!monarchId || !state.discovered.has(monarchId)) return

    event.preventDefault()
    state.selectedMonarchId = monarchId
    render()
  })

  boundMonarchInfo.addEventListener('click', (event) => {
    const closeButton = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-close-monarch-info="true"]') : null
    if (!closeButton) return

    state.selectedMonarchId = null
    render()
  })
}

function bindViewportInteractions(viewport: HTMLDivElement): void {
  let activePointerId: number | null = null
  let dragStartX = 0
  let dragStartView = state.view

  viewport.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault()
      const rect = viewport.getBoundingClientRect()
      const focalPoint = clamp((event.clientX - rect.left) / rect.width, 0, 1)
      const factor = Math.exp(event.deltaY * 0.0012)
      zoomAround(factor, focalPoint)
    },
    { passive: false },
  )

  viewport.addEventListener('pointerdown', (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest('.monarch-card[data-monarch-id]') : null
    if (target) {
      return
    }

    activePointerId = event.pointerId
    dragStartX = event.clientX
    dragStartView = { ...state.view }
    viewport.setPointerCapture(event.pointerId)
    viewport.dataset.dragging = 'true'
  })

  viewport.addEventListener('pointermove', (event) => {
    if (activePointerId !== event.pointerId) return
    const dx = event.clientX - dragStartX
    const span = dragStartView.end - dragStartView.start
    const yearsPerPixel = span / viewport.clientWidth
    const nextStart = dragStartView.start - dx * yearsPerPixel
    state.view = sanitizeView(nextStart, nextStart + span)
    render()
  })

  const release = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return
    activePointerId = null
    viewport.dataset.dragging = 'false'
  }

  viewport.addEventListener('pointerup', release)
  viewport.addEventListener('pointercancel', release)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
