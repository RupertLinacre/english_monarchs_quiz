import './style.css'
import { getEventSummary, getExactReignLabel, getMonarchBio, getMonarchExactReigns } from './content'
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
  isCurrent: boolean
}

type AppState = {
  answered: Set<string>
  completed: Set<string>
  skipped: Set<string>
  inputValue: string
  status: string
  startedAt: number
  completedAt: number | null
  revealedAll: boolean
  view: ViewState
  recentMonarchId: string | null
  selectedMonarchId: string | null
  portraitUrls: Map<string, string>
  questionOrder: string[]
  currentMonarchId: string | null
  hintVisible: boolean
  awaitingNextQuestion: boolean
  resultKind: 'correct' | 'skipped' | null
  revealAnimationMonarchId: string | null
}

const WORLD_SPAN = WORLD_END_YEAR - WORLD_START_YEAR
const MIN_VIEW_SPAN = 8
const eventLanes = 4
const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
const eventExplainers: Record<string, string> = {
  hastings: 'A huge invasion battle decided the crown.',
  domesday: 'This was a giant survey showing who owned land and animals.',
  'new-forest': 'The ruler was shot while hunting in the forest.',
  'white-ship': 'The heir drowned, so the kingdom had no clear next king.',
  treasury: 'Royal money records were written down very carefully.',
  anarchy: 'People fought over who should rule, and life became unsafe.',
  'lady-of-english': 'A rival claimant was accepted by some people as ruler.',
  becket: 'Thomas Becket was killed after arguing with the crown about power.',
  ireland: 'The crown asserted its authority in Ireland.',
  'third-crusade': 'The ruler spent much of the reign in a famous holy war abroad.',
  lionheart: 'The ruler gained a lasting reputation as a brave warrior.',
  'magna-carta': 'The king had to promise not to be unfair or too powerful.',
  'barons-war': 'Powerful lords fought the king over how he ruled.',
  montfort: 'Important people met to help choose how the country should be run.',
  'westminster-abbey': 'The great church at Westminster was rebuilt on a grand scale.',
  wales: 'The conquest of Wales changed how it was ruled.',
  'model-parliament': 'This meeting helped shape the future Parliament.',
  bannockburn: 'Scotland won a famous battle that defined the reign.',
  'hundred-years-war': 'Big victories in a long war with France defined the reign.',
  'black-death': 'A terrible sickness killed many people across the country.',
  'peasants-revolt': 'Poor people rose up because life felt unfair.',
  deposed: 'The ruler lost the crown and was forced off the throne.',
  deposition: 'The crown was taken from the previous king.',
  agincourt: 'A famous victory against France defined the reign.',
  troyes: 'This treaty said the English ruler would inherit the French crown.',
  'wars-of-roses': 'Two royal families fought over who should be king.',
  madness: 'The ruler became too unwell to govern steadily.',
  towton: 'A huge battle helped secure the crown.',
  tewkesbury: 'Victory in battle restored the ruler to the throne.',
  'princes-tower': 'One of the vanished princes in the Tower briefly held the crown.',
  'princes-r3': 'The missing princes remain the great mystery of the reign.',
  bosworth: 'Defeat in battle ended the reign and the old dynasty.',
  'bosworth-h7': 'Victory in battle founded a new dynasty.',
  'tudor-rose': 'This marriage joined two fighting families together.',
  'break-rome': 'England’s church split away from the Pope.',
  dissolution: 'Monasteries were closed and their lands were taken.',
  'prayer-book': 'A new church book changed how services were held.',
  somerset: 'People rebelled because changes made life harder.',
  'nine-days': 'This reign lasted only a very short time.',
  'bloody-mary': 'Protestants were burned for their beliefs.',
  calais: 'England lost its last piece of land in France.',
  armada: 'England stopped Spain’s great fleet from invading.',
  'mary-queen-scots': 'A rival claimant was executed after years of tension.',
  gunpowder: 'A plot tried to blow up the king and Parliament.',
  'king-james-bible': 'A famous English Bible was published.',
  'civil-war': 'The king and Parliament fought over who had power.',
  'execution-c1': 'The king was put to death after the war.',
  restoration: 'The monarchy came back after years without a king.',
  'great-fire': 'A huge fire burned much of London.',
  'glorious-revolution': 'The ruler was pushed out and new rulers were chosen.',
  'glorious-revolution-w3': 'A new ruler took the crown in the Glorious Revolution.',
  boyne: 'A key battle in Ireland secured the new settlement.',
  'joint-rule': 'Two rulers shared the crown as king and queen.',
  union: 'England and Scotland joined to make Great Britain.',
  marlborough: 'British armies won famous battles on the continent.',
  'jacobite-1715': 'Supporters of the old royal family tried to take back the crown.',
  'jacobite-1745': 'Bonnie Prince Charlie tried to win the throne.',
  'american-independence': 'Britain lost control of the American colonies.',
  napoleon: 'Britain helped defeat Napoleon at Waterloo.',
  regency: 'The monarch was too ill to rule, so a regent took over.',
  'reform-act': 'More people got a say in choosing Members of Parliament.',
  'great-exhibition': 'Britain showed off inventions and goods from around the world.',
  jubilee: 'People celebrated an exceptionally long reign.',
  'edwardian-age': 'This began a stylish new period before the First World War.',
  'first-world-war': 'Britain entered a huge war fought across the world.',
  'windsor-name': 'The royal family changed its house name during wartime.',
  abdication: 'The ruler gave up the throne to marry Wallis Simpson.',
  'second-world-war': 'Britain went to war again against Nazi Germany.',
  blitz: 'German bombing badly damaged British towns and cities.',
  'televised-coronation': 'Millions watched the coronation live on television.',
  'platinum-jubilee': 'People celebrated 70 years on the throne.',
  'accession-c3': 'A new reign began when the previous monarch died.',
  'coronation-2023': 'A grand coronation took place at Westminster Abbey.',
}

const aliasMap = buildAliasMap(monarchs)
const monarchById = new Map(monarchs.map((monarch) => [monarch.id, monarch]))
const houseColorMap = new Map(housePeriods.map((house) => [house.label, house.color]))
const monarchLanes = assignMonarchLanes(monarchs)
const questionOrder = shuffle(monarchs.map((monarch) => monarch.id))
const initialQuestionId = questionOrder[0] ?? null
const initialQuestionMonarch = initialQuestionId ? monarchById.get(initialQuestionId) ?? null : null

const state: AppState = {
  answered: new Set(),
  completed: new Set(),
  skipped: new Set(),
  inputValue: '',
  status: '',
  startedAt: Date.now(),
  completedAt: null,
  revealedAll: false,
  view: initialQuestionMonarch ? getFocusedView(initialQuestionMonarch) : { start: WORLD_START_YEAR, end: WORLD_END_YEAR },
  recentMonarchId: null,
  selectedMonarchId: null,
  portraitUrls: new Map(),
  questionOrder,
  currentMonarchId: initialQuestionId,
  hintVisible: false,
  awaitingNextQuestion: false,
  resultKind: null,
  revealAnimationMonarchId: null,
}

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root was not found.')
}

app.innerHTML = `
  <main class="app-shell">
    <section class="summary-strip" aria-label="Quiz summary">
      <strong id="progress-value" class="summary-pill summary-pill--strong">Q 1/${monarchs.length} · 0 correct</strong>
      <span id="timer-value" class="summary-pill">00:00</span>
    </section>

    <section class="quiz-entry">
      <div class="quiz-entry__header">
        <h1>Name the monarch</h1>
      </div>

      <section class="controls">
        <label class="answer-box" for="answer-input">
          <span class="answer-box__label">Your answer</span>
          <div class="answer-box__row">
            <input
              id="answer-input"
              class="answer-box__input"
              type="text"
              autocomplete="off"
              autocapitalize="words"
              spellcheck="false"
              placeholder="Type the monarch name..."
            />
            <span id="answer-feedback" class="answer-feedback" aria-live="polite"></span>
          </div>
        </label>
        <div class="control-cluster">
          <button id="quiz-action" class="control-button" type="button">Skip</button>
        </div>
      </section>
    </section>

    <section id="quiz-panel" class="quiz-panel" aria-live="polite"></section>

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

const quizPanel = document.querySelector<HTMLElement>('#quiz-panel')
const answerInput = document.querySelector<HTMLInputElement>('#answer-input')
const answerFeedback = document.querySelector<HTMLElement>('#answer-feedback')
const progressValue = document.querySelector<HTMLElement>('#progress-value')
const timerValue = document.querySelector<HTMLElement>('#timer-value')
const statusText = document.querySelector<HTMLElement>('#status-text')
const timelineViewport = document.querySelector<HTMLDivElement>('#timeline-viewport')
const monarchInfo = document.querySelector<HTMLElement>('#monarch-info')
const quizActionButton = document.querySelector<HTMLButtonElement>('#quiz-action')

if (
  !quizPanel ||
  !answerInput ||
  !answerFeedback ||
  !progressValue ||
  !timerValue ||
  !statusText ||
  !timelineViewport ||
  !monarchInfo ||
  !quizActionButton
) {
  throw new Error('Failed to bind required UI elements.')
}

const boundQuizPanel = quizPanel
const boundAnswerInput = answerInput
const boundAnswerFeedback = answerFeedback
const boundProgressValue = progressValue
const boundTimerValue = timerValue
const boundStatusText = statusText
const boundTimelineViewport = timelineViewport
const boundMonarchInfo = monarchInfo
const boundQuizActionButton = quizActionButton

boundAnswerInput.addEventListener('input', (event) => {
  state.inputValue = event.currentTarget instanceof HTMLInputElement ? event.currentTarget.value : ''
  if (tryAcceptCurrentAnswer()) return
})

boundAnswerInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return
  event.preventDefault()
  submitCurrentGuess()
})

boundQuizActionButton.addEventListener('click', () => {
  if (state.awaitingNextQuestion) {
    goToNextQuestion()
    return
  }

  skipCurrentQuestion()
})

bindViewportInteractions(boundTimelineViewport)
bindPanelInteractions(boundQuizPanel, boundMonarchInfo, boundTimelineViewport)
window.addEventListener('resize', () => {
  render()
})

window.setInterval(() => {
  renderSummary()
}, 1000)

void loadPortraitManifest()

render()
boundAnswerInput.focus()

function render(): void {
  renderSummary()
  boundStatusText.textContent = state.status
  boundAnswerInput.value = state.inputValue
  boundAnswerInput.disabled = !state.currentMonarchId || state.awaitingNextQuestion
  boundAnswerInput.placeholder = !state.currentMonarchId ? 'Quiz finished' : state.awaitingNextQuestion ? 'Click next question...' : 'Type the monarch name...'
  boundAnswerFeedback.textContent = state.awaitingNextQuestion ? (state.resultKind === 'correct' ? '✓ Correct' : 'Skipped') : ''
  boundAnswerFeedback.dataset.kind = state.awaitingNextQuestion ? (state.resultKind ?? 'skipped') : ''
  boundQuizActionButton.hidden = !state.currentMonarchId
  boundQuizActionButton.disabled = !state.currentMonarchId
  boundQuizActionButton.textContent = state.awaitingNextQuestion ? (getNextQuestionId() ? 'Next question' : 'Finish quiz') : 'Skip'
  boundQuizActionButton.classList.toggle('control-button--strong', state.awaitingNextQuestion)
  boundQuizPanel.innerHTML = renderQuestionPanel()
  boundTimelineViewport.innerHTML = renderTimeline()
  boundMonarchInfo.innerHTML = renderMonarchInfo()
}

function renderSummary(): void {
  const correctCount = state.answered.size
  const skippedCount = state.skipped.size
  const currentQuestionNumber = state.currentMonarchId
    ? state.completed.has(state.currentMonarchId)
      ? state.completed.size
      : state.completed.size + 1
    : monarchs.length
  const questionSummary = state.currentMonarchId ? `Q ${currentQuestionNumber}/${monarchs.length}` : 'Done'
  const scoreSummary =
    skippedCount > 0
      ? `${correctCount} correct, ${skippedCount} skipped`
      : `${correctCount} correct`

  boundProgressValue.textContent = `${questionSummary} · ${scoreSummary}`

  const endTime = state.completedAt ?? Date.now()
  boundTimerValue.textContent = formatElapsed(endTime - state.startedAt)
}

function renderQuestionPanel(): string {
  const currentMonarch = state.currentMonarchId ? monarchById.get(state.currentMonarchId) ?? null : null

  if (!currentMonarch) {
    const totalTime = state.completedAt ? formatElapsed(state.completedAt - state.startedAt) : formatElapsed(Date.now() - state.startedAt)
    const title = state.revealedAll ? 'Review mode' : 'Quiz complete'
    const scoreSummary =
      state.skipped.size > 0
        ? `${state.answered.size} correct and ${state.skipped.size} skipped`
        : `${state.answered.size} correct`
    const body = state.revealedAll
      ? `All ${monarchs.length} monarchs have been revealed for review. Use the timeline and review card below to revise the sequence.`
      : `Finished in ${totalTime}: ${scoreSummary}. Click any revealed reign or card to review it below.`

    return `
      <section class="quiz-panel__card quiz-panel__card--summary">
        <p class="quiz-panel__eyebrow">${title}</p>
        <h2>${body}</h2>
      </section>
    `
  }

  const exactReigns = getMonarchExactReigns(currentMonarch)
  const answerRevealed = state.awaitingNextQuestion && state.resultKind !== null
  const portraitRevealed = state.hintVisible
  const portraitUrl = portraitRevealed ? state.portraitUrls.get(currentMonarch.id) : undefined
  const reignLabel = answerRevealed ? `${currentMonarch.name} reigned` : 'This monarch reigned:'
  const eventNotes = currentMonarch.events
    .slice()
    .sort((left, right) => left.year - right.year)
    .map((event) => ({
      year: event.year,
      label: event.label,
      note: getEventSummary(currentMonarch.id, event.id, event.label),
    }))

  return `
    <section class="quiz-panel__card">
      <div class="quiz-panel__grid ${answerRevealed ? 'quiz-panel__grid--details-only' : ''}">
        <div class="quiz-panel__details">
          <div class="quiz-panel__section">
            <span class="quiz-panel__label">${reignLabel}</span>
            <div class="quiz-panel__chips">
              ${exactReigns.map((reign) => `<span class="quiz-panel__chip">${reign}</span>`).join('')}
            </div>
          </div>

          <div class="quiz-panel__section">
            <span class="quiz-panel__label">What happened in this reign</span>
            <ul class="quiz-panel__notes">
              ${
                eventNotes.length > 0
                  ? eventNotes
                      .map(
                        (event) => `
                          <li class="quiz-panel__note">
                            <strong>${event.year}</strong>
                            <div>
                              <span>${event.label}</span>
                              <small>${event.note}</small>
                            </div>
                          </li>
                        `,
                      )
                      .join('')
                  : '<li class="quiz-panel__note quiz-panel__note--empty"><span>No extra notes recorded for this reign.</span></li>'
              }
            </ul>
          </div>
        </div>

        ${
          answerRevealed
            ? ''
            : `
              <div
                class="quiz-panel__hint ${portraitRevealed ? 'quiz-panel__hint--visible' : ''} ${!portraitRevealed ? 'quiz-panel__hint--clickable' : ''}"
                ${!portraitRevealed ? 'data-toggle-hint="true" role="button" tabindex="0" aria-label="Reveal the portrait hint"' : ''}
              >
                ${
                  portraitRevealed
                    ? portraitUrl
                      ? `<img src="${portraitUrl}" alt="Portrait hint for the current monarch" loading="lazy" />`
                      : '<div class="quiz-panel__hint-fallback">Portrait hint unavailable for this reign.</div>'
                    : '<div class="quiz-panel__hint-placeholder">Click to reveal portrait (clue)</div>'
                }
              </div>
            `
        }
      </div>
    </section>
  `
}

function renderTimeline(): string {
  const viewSpan = state.view.end - state.view.start
  const housesHtml = renderHouses(housePeriods)
  const segmentsHtml = renderMonarchSegments(monarchs)
  const cardsHtml = renderMonarchCards(monarchs)
  const ticksHtml = renderAxisTicks()
  const eventsHtml = renderEvents(monarchs)
  const orientationClass = isMobileTimeline() ? 'timeline-stage--vertical' : ''

  return `
    <div class="timeline-stage ${orientationClass}">
      <div class="timeline-stage__houses">${housesHtml}</div>
      <div class="timeline-stage__monarchs">${segmentsHtml}${cardsHtml}</div>
      <div class="timeline-stage__axis">
        <div class="timeline-axis-line"></div>
        ${ticksHtml}
      </div>
      <div class="timeline-stage__events">${eventsHtml}</div>
      <div class="timeline-stage__legend">
        <span><i class="legend-swatch legend-swatch--target"></i> Current clue</span>
        <span><i class="legend-swatch legend-swatch--found"></i> Revealed monarch</span>
        <span><i class="legend-swatch legend-swatch--ghost"></i> Other reigns</span>
        <span><i class="legend-dot"></i> Key event</span>
        <span>${Math.round(viewSpan)} year window</span>
      </div>
    </div>
  `
}

function renderHouses(periods: HousePeriod[]): string {
  const mobileTimeline = isMobileTimeline()
  return periods
    .filter((period) => overlaps(period.start, period.end, state.view.start, state.view.end))
    .map((period) => {
      const metrics = getMetrics(period.start, period.end)
      if (!metrics) return ''

      const labelVisible = metrics.widthPx > 90
      const renderedStart = getRenderedRangeStartPercent(metrics)
      const style = mobileTimeline
        ? `top:${renderedStart}%; height:${metrics.widthPct}%; --house-color:${period.color};`
        : `left:${metrics.leftPct}%; width:${metrics.widthPct}%; --house-color:${period.color};`
      return `
        <div
          class="house-band"
          style="${style}"
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

  const mobileTimeline = isMobileTimeline()
  const revealed = state.completed.has(monarch.id)
  const target = state.currentMonarchId === monarch.id && !revealed
  const recent = state.recentMonarchId === monarch.id
  const houseColor = houseColorMap.get(monarch.house) ?? '#6c4b3a'
  const trackOffset = mobileTimeline ? 12 + lane * 18 : 344 + lane * 16
  const renderedStart = getRenderedRangeStartPercent(metrics)
  const exactDates = getExactReignLabel(monarch.id, reignIndex, reign)
  const stateClass = revealed ? 'reign-segment--found' : target ? 'reign-segment--target' : 'reign-segment--ghost'
  const accessibleLabel = revealed ? `${monarch.name}: ${exactDates}` : target ? `Current clue: ${exactDates}` : exactDates
  const tooltipTitle = revealed ? `${monarch.name}: ${exactDates}` : target ? `Current clue · ${exactDates}` : exactDates
  const style = mobileTimeline
    ? `top:${renderedStart}%; height:${Math.max(metrics.widthPct, 0.35)}%; left:${trackOffset}px; --segment-color:${houseColor};`
    : `left:${metrics.leftPct}%; width:${Math.max(metrics.widthPct, 0.35)}%; top:${trackOffset}px; --segment-color:${houseColor};`

  return `
    <div
      class="reign-segment ${stateClass} ${recent ? 'reign-segment--recent' : ''}"
      style="${style}"
      title="${tooltipTitle}"
      tabindex="0"
      aria-label="${accessibleLabel}"
      data-monarch-id="${monarch.id}"
    >
      <span class="reign-segment__tooltip">
        ${revealed ? `<strong>${monarch.name}</strong>` : target ? '<strong>Current clue</strong>' : ''}
        <span>${exactDates}</span>
      </span>
    </div>
  `
}

function renderMonarchCards(items: Monarch[]): string {
  const mobileTimeline = isMobileTimeline()
  const visibleFound = items
    .filter((monarch) => state.completed.has(monarch.id))
    .map((monarch) => {
      const metrics = getBestVisibleCardMetrics(monarch)
      if (!metrics) return null

      const widthPx = Math.max(metrics.widthPx, 18)
      const baseMode = getCardMode(widthPx, monarch.id === state.recentMonarchId)
      if (!baseMode) return null

      return {
        monarch,
        center: getRenderedCenterPercent(metrics),
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
      const revealAnimation = placement.monarch.id === state.revealAnimationMonarchId
      const footprint = getCardFootprint(placement.mode)
      const trackOffset = mobileTimeline
        ? 28 + placement.lane * 24 + placement.stack * (footprint.width + 10)
        : 14 + placement.lane * 34 + placement.stack * 116
      const imageVisible = placement.mode !== 'badge'
      const dateVisible = placement.mode !== 'badge'
      const style = mobileTimeline
        ? `top:${placement.center}%; left:${trackOffset}px; width:${footprint.width}px;`
        : `left:${placement.center}%; top:${trackOffset}px; width:${footprint.width}px;`

      return `
        <article
          class="monarch-card monarch-card--${placement.mode} ${recent ? 'monarch-card--recent' : ''} ${revealAnimation ? 'monarch-card--reveal' : ''}"
          style="${style}"
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

  if (!monarch || !state.completed.has(monarch.id)) {
    return ''
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
  const mobileTimeline = isMobileTimeline()
  const step = getTickStep(state.view.end - state.view.start)
  const firstTick = Math.ceil(state.view.start / step) * step
  const ticks: string[] = []

  for (let year = firstTick; year < state.view.end; year += step) {
    const x = getRenderedYearPercent(year)
    ticks.push(`
      <div class="axis-tick" style="${mobileTimeline ? `top:${x}%;` : `left:${x}%;`}">
        <span>${year}</span>
      </div>
    `)
  }

  return ticks.join('')
}

function renderEvents(items: Monarch[]): string {
  const mobileTimeline = isMobileTimeline()
  const maxEventsPerMonarch = getVisibleEventLimitPerMonarch(state.view.end - state.view.start)

  const allEvents = items.flatMap((monarch) =>
    monarch.events.slice(0, maxEventsPerMonarch).map((event) => ({
      id: event.id,
      year: event.year,
      label: event.label,
      detail: getEventExplanation(event.id, event.label, monarch.name, event.detail),
      monarchName: monarch.name,
      isCurrent: monarch.id === state.currentMonarchId,
    })),
  )

  const placements = placeEvents(allEvents)

  return placements
    .map((event) => {
      const x = getRenderedYearPercent(event.year)
      const trackOffset = mobileTimeline ? 12 + event.lane * 54 : 24 + event.lane * 44
      const style = mobileTimeline ? `top:${x}%; left:${trackOffset}px;` : `left:${x}%; top:${trackOffset}px;`
      return `
        <div
          class="timeline-event ${event.showLabel ? '' : 'timeline-event--dot-only'} ${event.isCurrent ? 'timeline-event--current' : ''}"
          style="${style}"
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

function tryAcceptCurrentAnswer(): boolean {
  if (state.awaitingNextQuestion) return false
  const normalized = normalizeAnswer(state.inputValue)
  if (!normalized || !state.currentMonarchId) return false
  if (aliasMap.get(normalized) !== state.currentMonarchId) return false
  return completeCurrentQuestion('correct')
}

function submitCurrentGuess(): void {
  if (!state.currentMonarchId || state.awaitingNextQuestion) return

  const normalized = normalizeAnswer(state.inputValue)
  if (!normalized) {
    state.status = 'Type a monarch name before submitting.'
    render()
    return
  }

  const matchId = aliasMap.get(normalized)
  if (matchId === state.currentMonarchId) {
    completeCurrentQuestion('correct')
    return
  }

  if (matchId) {
    const wrongMonarch = monarchById.get(matchId)
    state.status = `${wrongMonarch?.name ?? 'That monarch'} does not match the highlighted reign.`
  } else {
    state.status = 'No match for that answer yet. Try the monarch name plus numeral, like "Henry VIII".'
  }

  render()
}

function completeCurrentQuestion(outcome: 'correct' | 'skipped'): boolean {
  const monarchId = state.currentMonarchId
  if (!monarchId || state.awaitingNextQuestion) return false

  const monarch = monarchById.get(monarchId)
  if (!monarch) return false

  state.completed.add(monarchId)
  if (outcome === 'correct') {
    state.answered.add(monarchId)
    state.skipped.delete(monarchId)
  } else {
    state.skipped.add(monarchId)
  }
  state.recentMonarchId = monarchId
  state.revealAnimationMonarchId = monarchId
  state.selectedMonarchId = monarchId
  state.inputValue = ''
  state.hintVisible = outcome === 'skipped'
  state.revealedAll = false
  state.awaitingNextQuestion = true
  state.resultKind = outcome
  boundAnswerInput.value = ''
  state.status = ''
  render()
  boundAnswerInput.blur()
  return true
}

function getNextQuestionId(): string | null {
  return state.questionOrder.find((monarchId) => !state.completed.has(monarchId)) ?? null
}

function skipCurrentQuestion(): void {
  completeCurrentQuestion('skipped')
}

function chooseQuestion(monarchId: string): void {
  if (state.completed.has(monarchId)) return
  if (state.currentMonarchId === monarchId && !state.awaitingNextQuestion) return

  state.currentMonarchId = monarchId
  state.awaitingNextQuestion = false
  state.resultKind = null
  state.revealAnimationMonarchId = null
  state.selectedMonarchId = null
  state.inputValue = ''
  state.hintVisible = false
  state.status = ''
  render()
  boundAnswerInput.focus()
}

function goToNextQuestion(): void {
  if (!state.awaitingNextQuestion) return

  state.awaitingNextQuestion = false
  state.resultKind = null
  state.revealAnimationMonarchId = null
  state.selectedMonarchId = null

  const nextQuestionId = getNextQuestionId()
  if (!nextQuestionId) {
    state.currentMonarchId = null
    state.completedAt = Date.now()
    state.status =
      state.skipped.size > 0
        ? `Complete in ${formatElapsed(state.completedAt - state.startedAt)}. ${state.answered.size} correct, ${state.skipped.size} skipped.`
        : `Complete in ${formatElapsed(state.completedAt - state.startedAt)}. All ${state.answered.size} answered correctly.`
    render()
    return
  }

  state.currentMonarchId = nextQuestionId
  state.status = ''
  render()
  focusCurrentQuestion(true, 1100)
  boundAnswerInput.focus()
}

function focusCurrentQuestion(animate: boolean, duration = 520): void {
  const monarch = state.currentMonarchId ? monarchById.get(state.currentMonarchId) ?? null : null

  if (!monarch) {
    if (animate) {
      animateViewTo(WORLD_START_YEAR, WORLD_END_YEAR, duration)
    } else {
      setView(WORLD_START_YEAR, WORLD_END_YEAR)
    }
    return
  }

  const focusedView = getFocusedView(monarch)
  if (animate) {
    animateViewTo(focusedView.start, focusedView.end, duration)
  } else {
    setView(focusedView.start, focusedView.end)
  }
}

function getFocusedView(monarch: Monarch): ViewState {
  const start = Math.min(...monarch.reigns.map((reign) => reign.start))
  const end = Math.max(...monarch.reigns.map((reign) => reign.end))
  return sanitizeView(start - 50, end + 50)
}

function zoomAround(factor: number, focalPoint = 0.5): void {
  const currentSpan = state.view.end - state.view.start
  const nextSpan = clamp(currentSpan * factor, MIN_VIEW_SPAN, WORLD_SPAN)
  const focusYear = state.view.start + currentSpan * focalPoint
  const nextStart = focusYear - nextSpan * focalPoint
  setView(nextStart, nextStart + nextSpan)
}

function animateViewTo(start: number, end: number, duration = 520): void {
  const from = { ...state.view }
  const target = sanitizeView(start, end)
  const startedAt = performance.now()

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

function isMobileTimeline(): boolean {
  return window.matchMedia('(max-width: 720px)').matches
}

function getTimelineAxisLengthPx(): number {
  return Math.max(1, isMobileTimeline() ? boundTimelineViewport.clientHeight : boundTimelineViewport.clientWidth)
}

function getRenderedRangeStartPercent(metrics: { leftPct: number; widthPct: number }): number {
  return isMobileTimeline() ? 100 - metrics.leftPct - metrics.widthPct : metrics.leftPct
}

function getRenderedCenterPercent(metrics: { leftPct: number; widthPct: number }): number {
  const center = metrics.leftPct + metrics.widthPct / 2
  return isMobileTimeline() ? 100 - center : center
}

function getRenderedYearPercent(year: number): number {
  const percent = percentFromYear(year)
  return isMobileTimeline() ? 100 - percent : percent
}

function getMetrics(start: number, end: number): { leftPct: number; widthPct: number; leftPx: number; widthPx: number } | null {
  const clippedStart = Math.max(start, state.view.start)
  const clippedEnd = Math.min(end, state.view.end)

  if (clippedEnd <= clippedStart) {
    return null
  }

  const leftPct = ((clippedStart - state.view.start) / (state.view.end - state.view.start)) * 100
  const widthPct = ((clippedEnd - clippedStart) / (state.view.end - state.view.start)) * 100
  const axisLength = getTimelineAxisLengthPx()
  const leftPx = (leftPct / 100) * axisLength
  const widthPx = (widthPct / 100) * axisLength

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

        mode = downgradeMode(mode)
      }
    }
  }

  return resolved
}

function downgradeMode(mode: CardMode): CardMode | null {
  if (mode === 'full') return 'compact'
  if (mode === 'compact') return 'badge'
  return null
}

function getCardFootprint(mode: CardMode): { width: number; height: number } {
  if (isMobileTimeline()) {
    if (mode === 'full') return { width: 96, height: 82 }
    if (mode === 'compact') return { width: 72, height: 64 }
    return { width: 36, height: 36 }
  }

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

    const axisCenter = getTimelineAxisLengthPx() / 2
    const bestCenterDistance = Math.abs(best.leftPx + best.widthPx / 2 - axisCenter)
    const currentCenterDistance = Math.abs(current.leftPx + current.widthPx / 2 - axisCenter)
    return currentCenterDistance < bestCenterDistance ? current : best
  })
}

function placeEvents(
  events: Array<{ id: string; year: number; label: string; detail?: string; monarchName: string; isCurrent: boolean }>,
): EventPlacement[] {
  const visible = events
    .filter((event) => event.year >= state.view.start && event.year <= state.view.end)
    .sort((left, right) => left.year - right.year)

  const laneEnds = new Array<number>(eventLanes).fill(-Infinity)
  const placements: EventPlacement[] = []
  const axisLength = getTimelineAxisLengthPx()

  for (const event of visible) {
    const labelWidth = estimateEventWidth(event.label)
    const xPx = (percentFromYear(event.year) / 100) * axisLength
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
      isCurrent: event.isCurrent,
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

function resolveAppUrl(path: string): string {
  return new URL(path.replace(/^\/+/, ''), appBaseUrl).toString()
}

async function loadPortraitManifest(): Promise<void> {
  try {
    const response = await fetch(resolveAppUrl('portraits/manifest.json'))
    if (!response.ok) return

    const manifest = (await response.json()) as Record<string, string>

    state.portraitUrls = new Map(
      Object.entries(manifest).map(([id, path]) => [id, resolveAppUrl(path)]),
    )
    render()
  } catch {
    // Local portraits are optional at startup; initials remain as fallback.
  }
}

function bindPanelInteractions(quiz: HTMLElement, info: HTMLElement, viewport: HTMLDivElement): void {
  quiz.addEventListener('click', (event) => {
    const hintButton = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-toggle-hint="true"]') : null
    if (hintButton && state.currentMonarchId) {
      state.hintVisible = !state.hintVisible
      render()
      return
    }
  })

  quiz.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    const hintButton = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-toggle-hint="true"]') : null
    if (!hintButton || !state.currentMonarchId) return

    event.preventDefault()
    state.hintVisible = true
    render()
  })

  info.addEventListener('click', (event) => {
    const closeButton = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-close-monarch-info="true"]') : null
    if (!closeButton) return

    state.selectedMonarchId = null
    render()
  })

  viewport.addEventListener('click', (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-monarch-id]') : null
    if (!target) return

    const monarchId = target.dataset.monarchId
    if (!monarchId) return

    if (target.classList.contains('reign-segment') && !state.completed.has(monarchId)) {
      chooseQuestion(monarchId)
      return
    }

    if (!state.completed.has(monarchId)) return

    state.selectedMonarchId = monarchId
    render()
  })

  viewport.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-monarch-id]') : null
    if (!target) return

    const monarchId = target.dataset.monarchId
    if (!monarchId) return

    if (target.classList.contains('reign-segment') && !state.completed.has(monarchId)) {
      event.preventDefault()
      chooseQuestion(monarchId)
      return
    }

    if (!state.completed.has(monarchId)) return

    event.preventDefault()
    state.selectedMonarchId = monarchId
    render()
  })
}

function bindViewportInteractions(viewport: HTMLDivElement): void {
  let activePointerId: number | null = null
  let dragStartPosition = 0
  let dragStartView = state.view

  viewport.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault()
      const rect = viewport.getBoundingClientRect()
      const focalPoint = isMobileTimeline()
        ? clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1)
        : clamp((event.clientX - rect.left) / rect.width, 0, 1)
      const factor = Math.exp(event.deltaY * 0.0012)
      zoomAround(factor, focalPoint)
    },
    { passive: false },
  )

  viewport.addEventListener('pointerdown', (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest('[data-monarch-id]') : null
    if (target) {
      return
    }

    activePointerId = event.pointerId
    dragStartPosition = isMobileTimeline() ? event.clientY : event.clientX
    dragStartView = { ...state.view }
    viewport.setPointerCapture(event.pointerId)
    viewport.dataset.dragging = 'true'
  })

  viewport.addEventListener('pointermove', (event) => {
    if (activePointerId !== event.pointerId) return
    const delta = (isMobileTimeline() ? event.clientY : event.clientX) - dragStartPosition
    const span = dragStartView.end - dragStartView.start
    const axisLength = isMobileTimeline() ? viewport.clientHeight : viewport.clientWidth
    const yearsPerPixel = span / Math.max(axisLength, 1)
    const nextStart = isMobileTimeline()
      ? dragStartView.start + delta * yearsPerPixel
      : dragStartView.start - delta * yearsPerPixel
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

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swapIndex]
    copy[swapIndex] = current
  }

  return copy
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
