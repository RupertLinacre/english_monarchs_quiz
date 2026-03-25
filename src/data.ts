export interface ReignRange {
  startDate: string
  endDate: string
  label: string
}

export interface MonarchEvent {
  id: string
  year: number
  label: string
  detail?: string
}

export interface Monarch {
  id: string
  name: string
  house: string
  reigns: ReignRange[]
  dateLabel: string
  aliases: string[]
  wikipediaTitle: string
  portraitFallback: string
  events: MonarchEvent[]
}

export interface HousePeriod {
  id: string
  label: string
  start: number
  end: number
  color: string
}

const currentYear = new Date().getFullYear()

export const WORLD_START_YEAR = 1050
export const WORLD_END_YEAR = currentYear + 1
export const WORLD_END_DATE = `${currentYear + 1}-01-01`

const fullDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function parseIsoDateParts(isoDate: string): { year: number; month: number; day: number } {
  const match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/.exec(isoDate)

  if (!match?.groups) {
    throw new Error(`Invalid ISO date: ${isoDate}`)
  }

  return {
    year: Number(match.groups.year),
    month: Number(match.groups.month),
    day: Number(match.groups.day),
  }
}

export function isoDateToTimelineYear(isoDate: string): number {
  const { year, month, day } = parseIsoDateParts(isoDate)
  const dateUtc = Date.UTC(year, month - 1, day)
  const yearStartUtc = Date.UTC(year, 0, 1)
  const nextYearStartUtc = Date.UTC(year + 1, 0, 1)

  return year + (dateUtc - yearStartUtc) / (nextYearStartUtc - yearStartUtc)
}

export function formatIsoDate(isoDate: string): string {
  const { year, month, day } = parseIsoDateParts(isoDate)
  return fullDateFormatter.format(new Date(Date.UTC(year, month - 1, day)))
}

export function formatReignRange(reign: ReignRange): string {
  const endLabel = reign.endDate === WORLD_END_DATE ? 'present' : formatIsoDate(reign.endDate)
  return `${formatIsoDate(reign.startDate)} to ${endLabel}`
}

export const housePeriods: HousePeriod[] = [
  { id: 'normandy', label: 'House of Normandy', start: 1066, end: 1154, color: '#6c4b3a' },
  { id: 'angevin', label: 'Angevins', start: 1154, end: 1216, color: '#8b5e34' },
  { id: 'plantagenet', label: 'Plantagenets', start: 1216, end: 1399, color: '#3f6b55' },
  { id: 'lancaster-a', label: 'Lancastrians', start: 1399, end: 1461, color: '#7f2f2f' },
  { id: 'york-a', label: 'Yorkists', start: 1461, end: 1470.8, color: '#355d8d' },
  { id: 'lancaster-b', label: 'Lancastrians', start: 1470.8, end: 1471.3, color: '#7f2f2f' },
  { id: 'york-b', label: 'Yorkists', start: 1471.3, end: 1485, color: '#355d8d' },
  { id: 'tudor', label: 'Tudors', start: 1485, end: 1603, color: '#7b4d26' },
  { id: 'stuart-a', label: 'Stuarts', start: 1603, end: 1649.1, color: '#4f4672' },
  { id: 'interregnum', label: 'Interregnum', start: 1649.1, end: 1660.4, color: '#5b5b5b' },
  { id: 'stuart-b', label: 'Stuarts', start: 1660.4, end: 1714.6, color: '#4f4672' },
  { id: 'hanover', label: 'Hanoverians', start: 1714.6, end: 1901.1, color: '#245663' },
  { id: 'saxe-coburg-gotha', label: 'Saxe-Coburg-Gotha', start: 1901.1, end: 1917.55, color: '#4e6761' },
  { id: 'windsor', label: 'Windsor', start: 1917.55, end: WORLD_END_YEAR, color: '#1d4d5a' },
]

export const monarchs: Monarch[] = [
  {
    id: 'william-i',
    name: 'William I',
    house: 'House of Normandy',
    // Uses the coronation date rather than the Hastings/regnal-year convention.
    reigns: [{ startDate: '1066-12-25', endDate: '1087-09-09', label: '1066-1087' }],
    dateLabel: '1066-1087',
    aliases: ['william the conqueror', 'william conqueror'],
    wikipediaTitle: 'William_the_Conqueror',
    portraitFallback: 'WI',
    events: [
      { id: 'hastings', year: 1066, label: 'Battle of Hastings' },
      { id: 'domesday', year: 1086, label: 'Domesday Book completed' },
    ],
  },
  {
    id: 'william-ii',
    name: 'William II',
    house: 'House of Normandy',
    reigns: [{ startDate: '1087-09-26', endDate: '1100-08-02', label: '1087-1100' }],
    dateLabel: '1087-1100',
    aliases: ['william rufus'],
    wikipediaTitle: 'William_II_of_England',
    portraitFallback: 'WII',
    events: [{ id: 'new-forest', year: 1100, label: 'Killed in the New Forest' }],
  },
  {
    id: 'henry-i',
    name: 'Henry I',
    house: 'House of Normandy',
    reigns: [{ startDate: '1100-08-05', endDate: '1135-12-01', label: '1100-1135' }],
    dateLabel: '1100-1135',
    aliases: ['henry beauclerc'],
    wikipediaTitle: 'Henry_I_of_England',
    portraitFallback: 'HI',
    events: [
      { id: 'white-ship', year: 1120, label: 'White Ship disaster' },
      { id: 'treasury', year: 1130, label: 'Earliest surviving Pipe Roll record' },
    ],
  },
  {
    id: 'stephen',
    name: 'Stephen',
    house: 'House of Blois',
    reigns: [{ startDate: '1135-12-26', endDate: '1154-10-25', label: '1135-1154' }],
    dateLabel: '1135-1154',
    aliases: ['king stephen', 'stephen of blois'],
    wikipediaTitle: 'Stephen,_King_of_England',
    portraitFallback: 'S',
    events: [{ id: 'anarchy', year: 1139, label: 'The Anarchy' }],
  },
  {
    id: 'matilda',
    name: 'Empress Matilda',
    house: 'House of Normandy',
    reigns: [{ startDate: '1141-04-08', endDate: '1141-11-01', label: '1141' }],
    dateLabel: '1141',
    aliases: ['matilda', 'empress maud', 'maud'],
    wikipediaTitle: 'Empress_Matilda',
    portraitFallback: 'EM',
    events: [{ id: 'lady-of-english', year: 1141, label: 'Proclaimed Lady of the English' }],
  },
  {
    id: 'henry-ii',
    name: 'Henry II',
    house: 'Angevins',
    reigns: [{ startDate: '1154-12-19', endDate: '1189-07-06', label: '1154-1189' }],
    dateLabel: '1154-1189',
    aliases: ['henry fitzempress'],
    wikipediaTitle: 'Henry_II_of_England',
    portraitFallback: 'HII',
    events: [
      { id: 'becket', year: 1170, label: 'Thomas Becket murdered' },
      { id: 'ireland', year: 1171, label: 'Royal expedition to Ireland' },
    ],
  },
  {
    id: 'richard-i',
    name: 'Richard I',
    house: 'Angevins',
    reigns: [{ startDate: '1189-09-03', endDate: '1199-04-06', label: '1189-1199' }],
    dateLabel: '1189-1199',
    aliases: ['richard the lionheart', 'lionheart'],
    wikipediaTitle: 'Richard_I_of_England',
    portraitFallback: 'RI',
    events: [
      { id: 'third-crusade', year: 1191, label: 'Third Crusade' },
      { id: 'captured', year: 1192, label: 'Captured on return from Crusade' },
    ],
  },
  {
    id: 'john',
    name: 'John',
    house: 'Angevins',
    reigns: [{ startDate: '1199-05-27', endDate: '1216-10-19', label: '1199-1216' }],
    dateLabel: '1199-1216',
    aliases: ['king john', 'john lackland'],
    wikipediaTitle: 'John,_King_of_England',
    portraitFallback: 'J',
    events: [
      { id: 'magna-carta', year: 1215, label: 'Magna Carta sealed' },
      { id: 'barons-war', year: 1215, label: "First Barons' War begins" },
    ],
  },
  {
    id: 'henry-iii',
    name: 'Henry III',
    house: 'Plantagenets',
    reigns: [{ startDate: '1216-10-28', endDate: '1272-11-16', label: '1216-1272' }],
    dateLabel: '1216-1272',
    aliases: [],
    wikipediaTitle: 'Henry_III_of_England',
    portraitFallback: 'HIII',
    events: [
      { id: 'montfort', year: 1265, label: "Simon de Montfort's Parliament" },
      { id: 'westminster-abbey', year: 1245, label: 'Westminster Abbey rebuilt' },
    ],
  },
  {
    id: 'edward-i',
    name: 'Edward I',
    house: 'Plantagenets',
    reigns: [{ startDate: '1272-11-20', endDate: '1307-07-07', label: '1272-1307' }],
    dateLabel: '1272-1307',
    aliases: ['edward longshanks', 'longshanks'],
    wikipediaTitle: 'Edward_I_of_England',
    portraitFallback: 'EI',
    events: [
      { id: 'wales', year: 1284, label: 'Statute of Rhuddlan after conquest of Wales' },
      { id: 'model-parliament', year: 1295, label: 'Model Parliament' },
    ],
  },
  {
    id: 'edward-ii',
    name: 'Edward II',
    house: 'Plantagenets',
    reigns: [{ startDate: '1307-07-08', endDate: '1327-01-20', label: '1307-1327' }],
    dateLabel: '1307-1327',
    aliases: [],
    wikipediaTitle: 'Edward_II_of_England',
    portraitFallback: 'EII',
    events: [{ id: 'bannockburn', year: 1314, label: 'Battle of Bannockburn' }],
  },
  {
    id: 'edward-iii',
    name: 'Edward III',
    house: 'Plantagenets',
    reigns: [{ startDate: '1327-01-25', endDate: '1377-06-21', label: '1327-1377' }],
    dateLabel: '1327-1377',
    aliases: [],
    wikipediaTitle: 'Edward_III_of_England',
    portraitFallback: 'EIII',
    events: [
      { id: 'hundred-years-war', year: 1346, label: 'Battle of Crécy' },
      { id: 'black-death', year: 1348, label: 'Black Death reaches England' },
    ],
  },
  {
    id: 'richard-ii',
    name: 'Richard II',
    house: 'Plantagenets',
    reigns: [{ startDate: '1377-06-22', endDate: '1399-09-29', label: '1377-1399' }],
    dateLabel: '1377-1399',
    aliases: [],
    wikipediaTitle: 'Richard_II_of_England',
    portraitFallback: 'RII',
    events: [
      { id: 'peasants-revolt', year: 1381, label: "Peasants' Revolt" },
      { id: 'deposed', year: 1399, label: 'Deposed by a rival claimant' },
    ],
  },
  {
    id: 'henry-iv',
    name: 'Henry IV',
    house: 'Lancastrians',
    reigns: [{ startDate: '1399-09-30', endDate: '1413-03-20', label: '1399-1413' }],
    dateLabel: '1399-1413',
    aliases: [],
    wikipediaTitle: 'Henry_IV_of_England',
    portraitFallback: 'HIV',
    events: [{ id: 'deposition', year: 1399, label: 'Deposes Richard II and takes the throne' }],
  },
  {
    id: 'henry-v',
    name: 'Henry V',
    house: 'Lancastrians',
    reigns: [{ startDate: '1413-03-21', endDate: '1422-08-31', label: '1413-1422' }],
    dateLabel: '1413-1422',
    aliases: [],
    wikipediaTitle: 'Henry_V_of_England',
    portraitFallback: 'HV',
    events: [
      { id: 'agincourt', year: 1415, label: 'Battle of Agincourt' },
      { id: 'troyes', year: 1420, label: 'Treaty of Troyes' },
    ],
  },
  {
    id: 'henry-vi',
    name: 'Henry VI',
    house: 'Lancastrians',
    reigns: [
      { startDate: '1422-09-01', endDate: '1461-03-04', label: '1422-1461' },
      { startDate: '1470-10-09', endDate: '1471-04-11', label: '1470-1471' },
    ],
    dateLabel: '1422-1461, 1470-1471',
    aliases: [],
    wikipediaTitle: 'Henry_VI_of_England',
    portraitFallback: 'HVI',
    events: [
      { id: 'wars-of-roses', year: 1455, label: 'Wars of the Roses begin' },
      { id: 'madness', year: 1453, label: 'Mental collapse destabilises rule' },
    ],
  },
  {
    id: 'edward-iv',
    name: 'Edward IV',
    house: 'Yorkists',
    reigns: [
      { startDate: '1461-03-04', endDate: '1470-10-03', label: '1461-1470' },
      { startDate: '1471-04-11', endDate: '1483-04-09', label: '1471-1483' },
    ],
    dateLabel: '1461-1470, 1471-1483',
    aliases: [],
    wikipediaTitle: 'Edward_IV_of_England',
    portraitFallback: 'EIV',
    events: [
      { id: 'towton', year: 1461, label: 'Battle of Towton' },
      { id: 'tewkesbury', year: 1471, label: 'Battle of Tewkesbury' },
    ],
  },
  {
    id: 'edward-v',
    name: 'Edward V',
    house: 'Yorkists',
    reigns: [{ startDate: '1483-04-09', endDate: '1483-06-25', label: '1483' }],
    dateLabel: '1483',
    aliases: [],
    wikipediaTitle: 'Edward_V_of_England',
    portraitFallback: 'EV',
    events: [{ id: 'princes-tower', year: 1483, label: 'One of the Princes in the Tower' }],
  },
  {
    id: 'richard-iii',
    name: 'Richard III',
    house: 'Yorkists',
    reigns: [{ startDate: '1483-06-26', endDate: '1485-08-22', label: '1483-1485' }],
    dateLabel: '1483-1485',
    aliases: [],
    wikipediaTitle: 'Richard_III_of_England',
    portraitFallback: 'RIII',
    events: [
      { id: 'princes-r3', year: 1483, label: 'Princes in the Tower' },
      { id: 'bosworth', year: 1485, label: 'Battle of Bosworth Field' },
    ],
  },
  {
    id: 'henry-vii',
    name: 'Henry VII',
    house: 'Tudors',
    reigns: [{ startDate: '1485-08-22', endDate: '1509-04-21', label: '1485-1509' }],
    dateLabel: '1485-1509',
    aliases: [],
    wikipediaTitle: 'Henry_VII_of_England',
    portraitFallback: 'HVII',
    events: [
      { id: 'bosworth-h7', year: 1485, label: 'Wins the crown at Bosworth' },
      { id: 'tudor-rose', year: 1486, label: 'Marriage unites Lancaster and York' },
    ],
  },
  {
    id: 'henry-viii',
    name: 'Henry VIII',
    house: 'Tudors',
    reigns: [{ startDate: '1509-04-22', endDate: '1547-01-28', label: '1509-1547' }],
    dateLabel: '1509-1547',
    aliases: [],
    wikipediaTitle: 'Henry_VIII',
    portraitFallback: 'HVIII',
    events: [
      { id: 'break-rome', year: 1534, label: 'Break with Rome' },
      { id: 'dissolution', year: 1536, label: 'Dissolution of the monasteries' },
    ],
  },
  {
    id: 'edward-vi',
    name: 'Edward VI',
    house: 'Tudors',
    reigns: [{ startDate: '1547-01-28', endDate: '1553-07-06', label: '1547-1553' }],
    dateLabel: '1547-1553',
    aliases: [],
    wikipediaTitle: 'Edward_VI',
    portraitFallback: 'EVI',
    events: [
      { id: 'prayer-book', year: 1549, label: 'Book of Common Prayer' },
      { id: 'somerset', year: 1549, label: "Kett's Rebellion" },
    ],
  },
  {
    id: 'jane-grey',
    name: 'Lady Jane Grey',
    house: 'Tudors',
    reigns: [{ startDate: '1553-07-10', endDate: '1553-07-19', label: '1553' }],
    dateLabel: '1553',
    aliases: ['jane grey', 'queen jane'],
    wikipediaTitle: 'Lady_Jane_Grey',
    portraitFallback: 'JG',
    events: [{ id: 'nine-days', year: 1553, label: 'Reign lasts only nine days' }],
  },
  {
    id: 'mary-i',
    name: 'Mary I',
    house: 'Tudors',
    reigns: [{ startDate: '1553-07-19', endDate: '1558-11-17', label: '1553-1558' }],
    dateLabel: '1553-1558',
    aliases: ['bloody mary'],
    wikipediaTitle: 'Mary_I_of_England',
    portraitFallback: 'MI',
    events: [
      { id: 'bloody-mary', year: 1555, label: 'Burning of Protestants' },
      { id: 'calais', year: 1558, label: 'England loses Calais' },
    ],
  },
  {
    id: 'elizabeth-i',
    name: 'Elizabeth I',
    house: 'Tudors',
    reigns: [{ startDate: '1558-11-17', endDate: '1603-03-24', label: '1558-1603' }],
    dateLabel: '1558-1603',
    aliases: ['gloriana', 'good queen bess'],
    wikipediaTitle: 'Elizabeth_I',
    portraitFallback: 'EI',
    events: [
      { id: 'armada', year: 1588, label: 'Spanish Armada defeated' },
      { id: 'mary-queen-scots', year: 1587, label: 'Mary, Queen of Scots executed' },
    ],
  },
  {
    id: 'james-i',
    name: 'James I',
    house: 'Stuarts',
    reigns: [{ startDate: '1603-03-24', endDate: '1625-03-27', label: '1603-1625' }],
    dateLabel: '1603-1625',
    aliases: ['james vi and i', 'james 6 and 1'],
    wikipediaTitle: 'James_VI_and_I',
    portraitFallback: 'JI',
    events: [
      { id: 'gunpowder', year: 1605, label: 'Gunpowder Plot' },
      { id: 'king-james-bible', year: 1611, label: 'Famous English Bible published' },
    ],
  },
  {
    id: 'charles-i',
    name: 'Charles I',
    house: 'Stuarts',
    reigns: [{ startDate: '1625-03-27', endDate: '1649-01-30', label: '1625-1649' }],
    dateLabel: '1625-1649',
    aliases: [],
    wikipediaTitle: 'Charles_I_of_England',
    portraitFallback: 'CI',
    events: [
      { id: 'civil-war', year: 1642, label: 'English Civil War begins' },
      { id: 'execution-c1', year: 1649, label: 'The king is executed' },
    ],
  },
  {
    id: 'charles-ii',
    name: 'Charles II',
    house: 'Stuarts',
    // Deliberately modeled from the 1660 Restoration rather than the de jure 1649 regnal-year start.
    reigns: [{ startDate: '1660-05-29', endDate: '1685-02-06', label: '1660-1685' }],
    dateLabel: '1660-1685',
    aliases: ['the merry monarch'],
    wikipediaTitle: 'Charles_II_of_England',
    portraitFallback: 'CII',
    events: [
      { id: 'restoration', year: 1660, label: 'The Restoration' },
      { id: 'great-fire', year: 1666, label: 'Great Fire of London' },
    ],
  },
  {
    id: 'james-ii',
    name: 'James II',
    house: 'Stuarts',
    reigns: [{ startDate: '1685-02-06', endDate: '1688-12-11', label: '1685-1688' }],
    dateLabel: '1685-1688',
    aliases: [],
    wikipediaTitle: 'James_II_of_England',
    portraitFallback: 'JII',
    events: [{ id: 'glorious-revolution', year: 1688, label: 'Glorious Revolution' }],
  },
  {
    id: 'william-iii',
    name: 'William III',
    house: 'Stuarts',
    reigns: [{ startDate: '1689-02-13', endDate: '1702-03-08', label: '1689-1702' }],
    dateLabel: '1689-1702',
    aliases: ['william of orange'],
    wikipediaTitle: 'William_III_of_England',
    portraitFallback: 'WIII',
    events: [
      { id: 'glorious-revolution-w3', year: 1688, label: 'Glorious Revolution' },
      { id: 'boyne', year: 1690, label: 'Battle of the Boyne' },
    ],
  },
  {
    id: 'mary-ii',
    name: 'Mary II',
    house: 'Stuarts',
    reigns: [{ startDate: '1689-02-13', endDate: '1694-12-28', label: '1689-1694' }],
    dateLabel: '1689-1694',
    aliases: [],
    wikipediaTitle: 'Mary_II_of_England',
    portraitFallback: 'MII',
    events: [{ id: 'joint-rule', year: 1689, label: 'Joint rule begins' }],
  },
  {
    id: 'anne',
    name: 'Anne',
    house: 'Stuarts',
    reigns: [{ startDate: '1702-03-08', endDate: '1714-08-01', label: '1702-1714' }],
    dateLabel: '1702-1714',
    aliases: ['queen anne'],
    wikipediaTitle: 'Anne,_Queen_of_Great_Britain',
    portraitFallback: 'A',
    events: [
      { id: 'union', year: 1707, label: 'Acts of Union' },
      { id: 'marlborough', year: 1704, label: 'Blenheim in the War of the Spanish Succession' },
    ],
  },
  {
    id: 'george-i',
    name: 'George I',
    house: 'Hanoverians',
    reigns: [{ startDate: '1714-08-01', endDate: '1727-06-11', label: '1714-1727' }],
    dateLabel: '1714-1727',
    aliases: [],
    wikipediaTitle: 'George_I_of_Great_Britain',
    portraitFallback: 'GI',
    events: [{ id: 'jacobite-1715', year: 1715, label: 'Jacobite rising of 1715' }],
  },
  {
    id: 'george-ii',
    name: 'George II',
    house: 'Hanoverians',
    reigns: [{ startDate: '1727-06-11', endDate: '1760-10-25', label: '1727-1760' }],
    dateLabel: '1727-1760',
    aliases: [],
    wikipediaTitle: 'George_II_of_Great_Britain',
    portraitFallback: 'GII',
    events: [{ id: 'jacobite-1745', year: 1745, label: 'Jacobite rising of 1745' }],
  },
  {
    id: 'george-iii',
    name: 'George III',
    house: 'Hanoverians',
    reigns: [{ startDate: '1760-10-25', endDate: '1820-01-29', label: '1760-1820' }],
    dateLabel: '1760-1820',
    aliases: [],
    wikipediaTitle: 'George_III',
    portraitFallback: 'GIII',
    events: [
      { id: 'american-independence', year: 1776, label: 'American colonies declare independence' },
      { id: 'napoleon', year: 1815, label: 'Waterloo ends the Napoleonic Wars' },
    ],
  },
  {
    id: 'george-iv',
    name: 'George IV',
    house: 'Hanoverians',
    reigns: [{ startDate: '1820-01-29', endDate: '1830-06-26', label: '1820-1830' }],
    dateLabel: '1820-1830',
    aliases: [],
    wikipediaTitle: 'George_IV',
    portraitFallback: 'GIV',
    events: [],
  },
  {
    id: 'william-iv',
    name: 'William IV',
    house: 'Hanoverians',
    reigns: [{ startDate: '1830-06-26', endDate: '1837-06-20', label: '1830-1837' }],
    dateLabel: '1830-1837',
    aliases: [],
    wikipediaTitle: 'William_IV',
    portraitFallback: 'WIV',
    events: [{ id: 'reform-act', year: 1832, label: 'Great Reform Act' }],
  },
  {
    id: 'victoria',
    name: 'Victoria',
    house: 'Hanoverians',
    reigns: [{ startDate: '1837-06-20', endDate: '1901-01-22', label: '1837-1901' }],
    dateLabel: '1837-1901',
    aliases: ['queen victoria'],
    wikipediaTitle: 'Queen_Victoria',
    portraitFallback: 'V',
    events: [
      { id: 'great-exhibition', year: 1851, label: 'Great Exhibition' },
      { id: 'jubilee', year: 1897, label: 'Diamond Jubilee' },
    ],
  },
  {
    id: 'edward-vii',
    name: 'Edward VII',
    house: 'Saxe-Coburg-Gotha',
    reigns: [{ startDate: '1901-01-22', endDate: '1910-05-06', label: '1901-1910' }],
    dateLabel: '1901-1910',
    aliases: [],
    wikipediaTitle: 'Edward_VII',
    portraitFallback: 'EVII',
    events: [{ id: 'edwardian-age', year: 1901, label: 'A new cultural era begins' }],
  },
  {
    id: 'george-v',
    name: 'George V',
    house: 'Windsor',
    reigns: [{ startDate: '1910-05-06', endDate: '1936-01-20', label: '1910-1936' }],
    dateLabel: '1910-1936',
    aliases: [],
    wikipediaTitle: 'George_V',
    portraitFallback: 'GV',
    events: [
      { id: 'first-world-war', year: 1914, label: 'Britain enters the First World War' },
      { id: 'windsor-name', year: 1917, label: 'Royal house adopts a new name' },
    ],
  },
  {
    id: 'edward-viii',
    name: 'Edward VIII',
    house: 'Windsor',
    reigns: [{ startDate: '1936-01-20', endDate: '1936-12-11', label: '1936' }],
    dateLabel: '1936',
    aliases: [],
    wikipediaTitle: 'Edward_VIII',
    portraitFallback: 'EVIII',
    events: [{ id: 'abdication', year: 1936, label: 'Abdication crisis' }],
  },
  {
    id: 'george-vi',
    name: 'George VI',
    house: 'Windsor',
    reigns: [{ startDate: '1936-12-11', endDate: '1952-02-06', label: '1936-1952' }],
    dateLabel: '1936-1952',
    aliases: [],
    wikipediaTitle: 'George_VI',
    portraitFallback: 'GVI',
    events: [
      { id: 'second-world-war', year: 1939, label: 'Second World War begins' },
      { id: 'blitz', year: 1940, label: 'The Blitz' },
    ],
  },
  {
    id: 'elizabeth-ii',
    name: 'Elizabeth II',
    house: 'Windsor',
    reigns: [{ startDate: '1952-02-06', endDate: '2022-09-08', label: '1952-2022' }],
    dateLabel: '1952-2022',
    aliases: [],
    wikipediaTitle: 'Elizabeth_II',
    portraitFallback: 'EII',
    events: [
      { id: 'televised-coronation', year: 1953, label: 'Televised coronation' },
      { id: 'platinum-jubilee', year: 2022, label: 'Platinum Jubilee' },
    ],
  },
  {
    id: 'charles-iii',
    name: 'Charles III',
    house: 'Windsor',
    reigns: [{ startDate: '2022-09-08', endDate: WORLD_END_DATE, label: '2022-present' }],
    dateLabel: '2022-present',
    aliases: [],
    wikipediaTitle: 'Charles_III',
    portraitFallback: 'CIII',
    events: [
      { id: 'accession-c3', year: 2022, label: 'New reign begins after a long one ends' },
      { id: 'coronation-2023', year: 2023, label: 'Modern coronation at Westminster Abbey' },
    ],
  },
]
