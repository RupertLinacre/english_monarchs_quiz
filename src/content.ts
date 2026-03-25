import { formatReignRange, type Monarch, type ReignRange } from './data'

const bioOverrides: Record<string, string> = {
  'william-i': "William the Conqueror won the Battle of Hastings in 1066 and changed England a lot. He brought in Norman rule, built castles, and ordered the Domesday Book so he could count land, people, and wealth.",
  'william-ii': "William II was known as 'William Rufus' because he had a very red face! He died in a mysterious accident when he was shot by a stray arrow while hunting in the New Forest.",
  'henry-i': "Henry I was the youngest son of William the Conqueror. Children often learn about the sad story of the White Ship, which sank in the sea with his only son on board.",
  'stephen': "Stephen had a huge argument with his cousin Matilda over who should rule England. This started a long time of fighting known as 'The Anarchy', where barons built castles without permission.",
  'matilda': "Empress Matilda fought a long war against her cousin Stephen to be the ruler of England. Although she was never officially crowned Queen, her son grew up to be a powerful King.",
  'henry-ii': "Henry II was a very energetic king who ruled England and a large part of France. He is famous for his terrible argument with his former friend Thomas Becket, the Archbishop of Canterbury.",
  'richard-i': "Richard I is famous as 'Richard the Lionheart' because he was a very brave warrior. Even though he was King of England, he spent almost his whole reign far away fighting in the Crusades.",
  'john': "King John is remembered for Magna Carta. Powerful barons forced him to agree that a king could not do whatever he wanted. People still learn about him because this helped start ideas about fair laws.",
  'henry-iii': "Henry III ruled for a very long time and loved beautiful things. He rebuilt Westminster Abbey, and even had a pet polar bear that swam in the River Thames to catch fish!",
  'edward-i': "Edward I was a tall, fierce warrior known as 'Longshanks' because of his long legs. He built massive, strong castles in Wales that you can still visit today.",
  'edward-ii': "Edward II was not a very successful soldier and lost the famous Battle of Bannockburn to the Scottish army. He was eventually forced to give up his crown.",
  'edward-iii': "Edward III started a huge fight with France called the Hundred Years' War. He had a famous son known as the Black Prince, who wore dark armour into battle.",
  'richard-ii': "Richard II became king when he was only 10 years old! While he was still a boy, he had to face the Peasants' Revolt, where poor people marched to London to complain about taxes.",
  'henry-iv': "Henry IV took the throne from his cousin Richard II to become the first king from the House of Lancaster. He had to spend a lot of time fighting rebellions to keep his crown safe.",
  'henry-v': "Henry V is remembered as one of England's greatest warrior kings. He bravely led his small, tired army to a famous victory over the French at the Battle of Agincourt.",
  'henry-vi': "Henry VI became king when he was just a tiny baby! He didn't like fighting and sometimes suffered from mental illness, which led to the battles known as the Wars of the Roses.",
  'edward-iv': "Edward IV was a very tall and strong king who fought for the House of York. He won lots of battles during the Wars of the Roses to become the ruler of England.",
  'edward-v': "Edward V was only 12 years old when he became king, but he was never crowned. He and his younger brother were sent to the Tower of London and mysteriously disappeared.",
  'richard-iii': "Richard III was the last English king to die in battle. He lost his crown at the Battle of Bosworth. Many hundreds of years later, scientists found his skeleton buried under a car park in Leicester!",
  'henry-vii': "Henry VII won the Battle of Bosworth to become king. To stop people fighting, he married a princess from the rival family and created the famous Tudor Rose, which is red and white.",
  'henry-viii': "Henry VIII is famous for having six wives and changing the church in England. He broke with the Pope so he could remarry, and his rule changed religion, money, and power across the kingdom.",
  'edward-vi': "Edward VI was Henry VIII's only surviving son. He became king when he was just 9 years old, but sadly he was often sick and died when he was only 15.",
  'jane-grey': "Lady Jane Grey is often called the 'Nine Days' Queen'. She was Queen for just over a week before Mary I took the throne and sent her to the Tower of London.",
  'mary-i': "Mary I was the first woman to be Queen of England in her own right. She is sometimes remembered as 'Bloody Mary' because she was very strict and punished people who did not follow her religion.",
  'elizabeth-i': "Elizabeth I was a strong Tudor queen. People remember her for the defeat of the Spanish Armada, brave speeches, and a time when theatre and exploration grew. She never married, so she was called the Virgin Queen.",
  'james-i': "James I was already King of Scotland when he became King of England too. He was king during the Gunpowder Plot, when Guy Fawkes tried to blow up Parliament with barrels of gunpowder!",
  'charles-i': "Charles I argued so much with Parliament that it started the English Civil War. Parliament's army won the war, and Charles was the only English king to have his head chopped off.",
  'charles-ii': "Charles II is called the 'Merry Monarch' because he loved parties and brought back Christmas and theatres after they were banned! He was king during the Great Fire of London.",
  'james-ii': "James II wasn't very popular because he tried to change the country's religion. The people asked his daughter to take over instead, and he ran away to France without a fight.",
  'william-iii': "William III came from Holland and was invited to take the English throne. He ruled equally alongside his wife, Mary II, which is the only time this has ever happened.",
  'mary-ii': "Mary II ruled the country as an equal partner with her husband, William of Orange. She was known for being kind and very interested in building beautiful gardens and palaces.",
  'anne': "Queen Anne had 17 children but sadly none lived to be adults. During her reign, England and Scotland officially joined together to become one big country called Great Britain.",
  'george-i': "George I was a German prince who became the King of Great Britain. When he first arrived in London to be king, he couldn't speak very much English at all!",
  'george-ii': "George II was the last British king to personally lead his soldiers into battle! He was also known to have a terrible temper and used to throw his wig across the room when he was angry.",
  'george-iii': "George III was king for a very long time, including when America fought for its independence. Later in his life, he became very sick and people sometimes called him the 'Mad King'.",
  'george-iv': "George IV loved eating, drinking, and spending lots of money on fancy clothes. He built the famous Royal Pavilion in Brighton, which looks exactly like an Indian palace.",
  'william-iv': "William IV was known as the 'Sailor King' because he spent many years in the Royal Navy. He was a friendly king who hated showing off and didn't want a big, fancy coronation.",
  'victoria': "Queen Victoria ruled for a very long time. Britain built railways, factories, and a huge empire during her reign. Many children learn about the Victorians because life, clothes, schools, and cities changed so much.",
  'edward-vii': "Edward VII was Queen Victoria's eldest son, so he had to wait a very long time to become king! He loved sports, driving the first cars, and having fun.",
  'george-v': "George V was king during the First World War. He changed his family's last name to 'Windsor' to sound more British, and was the very first king to talk on the radio at Christmas.",
  'edward-viii': "Edward VIII was king for less than a year. He gave up the throne because he wanted to marry Wallis Simpson. That surprising choice changed the royal family and made his brother George VI king instead.",
  'george-vi': "George VI was Elizabeth II's father. Even though he had a stammer that made it hard for him to talk, he bravely gave speeches on the radio to cheer people up during the Second World War.",
  'elizabeth-ii': "Elizabeth II was queen for 70 years, longer than any other British monarch. She met many prime ministers, saw huge changes in the world, and became well known for duty, calmness, and her corgis.",
  'charles-iii': "Charles III became king in 2022 after Queen Elizabeth II died. Before that, he was Prince of Wales for many years. Children may know him for his coronation and for caring about nature and old buildings.",
}

const eventSummaryOverrides: Record<string, string> = {
  hastings: 'A decisive invasion battle that changed who ruled England.',
  domesday: 'A huge survey recorded land, wealth, and who owned what.',
  'new-forest': 'A sudden death in a hunting accident ended the reign.',
  'white-ship': 'A succession crisis followed a famous shipwreck.',
  treasury: 'Royal finance records became more systematic and detailed.',
  anarchy: 'A civil war over the crown made the kingdom unstable.',
  'lady-of-english': 'A rival claimant briefly took control in part of the kingdom.',
  becket: 'A clash between crown and church ended in shocking violence.',
  ireland: 'Royal power was asserted across the Irish Sea.',
  'third-crusade': 'This reign is closely linked with crusading warfare abroad.',
  captured: 'The ruler was captured while returning from crusade.',
  'magna-carta': 'The crown was forced to accept limits on its power.',
  'barons-war': 'Powerful nobles openly fought the ruler.',
  montfort: 'A landmark assembly helped shape the future of Parliament.',
  'westminster-abbey': 'A major royal church was rebuilt on a grand scale.',
  wales: 'The conquest of Wales reshaped rule there.',
  'model-parliament': 'A famous parliament set a pattern for later representation.',
  bannockburn: 'A major defeat to Scotland defined the reign.',
  'hundred-years-war': 'Big victories in France became central to the reign’s memory.',
  'black-death': 'Plague transformed life across the kingdom.',
  'peasants-revolt': 'A major popular uprising reached London.',
  deposed: 'The ruler was overthrown and lost the crown.',
  deposition: 'The crown was taken from the previous ruler.',
  agincourt: 'A famous battlefield victory against France shaped the reign.',
  troyes: 'A treaty transformed the royal claim in France.',
  'wars-of-roses': 'Dynastic conflict broke out during this reign.',
  madness: 'A collapse in the ruler’s health destabilised government.',
  towton: 'A decisive battle helped win the throne.',
  tewkesbury: 'A return to power was secured in battle.',
  'princes-tower': 'This reign is tied to the mystery of the Princes in the Tower.',
  'princes-r3': 'The fate of the princes remains the most famous question from this reign.',
  bosworth: 'Defeat in battle ended the old dynasty.',
  'bosworth-h7': 'Victory in battle created a new dynasty.',
  'tudor-rose': 'A royal marriage was used to unite rival houses.',
  'break-rome': 'The church in England broke away from papal authority.',
  dissolution: 'Monasteries were closed and their property was seized.',
  'prayer-book': 'Religious worship was reshaped by a new prayer book.',
  somerset: 'Rebellion showed how tense religious and economic change had become.',
  'nine-days': 'The reign lasted only a few days.',
  'bloody-mary': 'Religious persecution became the defining issue of the reign.',
  calais: 'England lost its last possession in France.',
  armada: 'A Spanish invasion fleet was defeated.',
  'mary-queen-scots': 'A rival claimant was executed after years of tension.',
  gunpowder: 'A plot targeted king and Parliament with explosives.',
  'king-james-bible': 'A famous English Bible translation was published.',
  'civil-war': 'War broke out between crown and Parliament.',
  'execution-c1': 'The ruler was executed after civil war.',
  restoration: 'The monarchy returned after years without a king.',
  'great-fire': 'A catastrophic fire destroyed much of London.',
  'glorious-revolution': 'The ruler was driven out in a constitutional crisis.',
  'glorious-revolution-w3': 'A change of ruler followed the Glorious Revolution.',
  boyne: 'A major battle in Ireland secured the settlement.',
  'joint-rule': 'The crown was held jointly by two rulers.',
  union: 'England and Scotland were united as Great Britain.',
  marlborough: 'Continental victories made Britain a major military power.',
  'jacobite-1715': 'A rising tried to restore the previous royal line.',
  'jacobite-1745': 'Another Jacobite challenge nearly overturned the regime.',
  'american-independence': 'Britain lost the American colonies.',
  napoleon: 'The Napoleonic Wars ended with victory at Waterloo.',
  regency: 'A prince ruled in place of the monarch during illness.',
  'reform-act': 'Parliamentary reform widened political representation.',
  'great-exhibition': 'Industrial power and empire were put on display.',
  jubilee: 'Public celebration focused on the extraordinary length of the reign.',
  'edwardian-age': 'A distinct early-20th-century cultural era began.',
  'first-world-war': 'The monarchy faced the pressures of total war.',
  'windsor-name': 'The royal family adopted a new house name.',
  abdication: 'The ruler gave up the crown for marriage.',
  'second-world-war': 'The monarchy became a symbol during another world war.',
  blitz: 'Bombing raids shaped the wartime home front.',
  'televised-coronation': 'A coronation reached millions through television.',
  'platinum-jubilee': 'The reign reached an unprecedented 70 years.',
  'accession-c3': 'The throne passed to a new ruler after a long reign ended.',
  'coronation-2023': 'A modern coronation renewed ancient ceremony.',
}

export function getExactReignLabel(_monarchId: string, _reignIndex: number, reign: ReignRange): string {
  return formatReignRange(reign)
}

export function getMonarchExactReigns(monarch: Monarch): string[] {
  return monarch.reigns.map((reign, reignIndex) => getExactReignLabel(monarch.id, reignIndex, reign))
}

export function getMonarchBio(monarch: Monarch): string {
  const override = bioOverrides[monarch.id]
  if (override) return override

  const shortHouse = monarch.house.replace(/^House of /, '')
  const keyEvents = monarch.events
    .slice(0, 2)
    .map((event) => event.label)
    .join(' and ')

  return `${monarch.name} was a ruler from the ${shortHouse} family. Children often remember this reign for ${keyEvents}. `
}

export function getEventSummary(_monarchId: string, eventId: string, label: string): string {
  return eventSummaryOverrides[eventId] ?? `${label} is one of the best-known events from this reign.`
}
