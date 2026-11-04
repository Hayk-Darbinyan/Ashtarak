/**
 * The admin renders the content document generically — every translatable
 * field, photograph and list is found by shape. This file only supplies the
 * human side: section names, field names and hints, in Armenian.
 */

export const SECTIONS = [
  { key: 'brand', title: 'Ընդհանուր տվյալներ', desc: 'Անուն, կոնտակտներ, հասցե, սեզոն, ժամեր' },
  { key: 'hero', title: 'Գլխավոր էկրան', desc: 'Առաջին էկրանը՝ ջրի ֆոնով' },
  { key: 'water', title: '02 — Ջուրը', desc: 'Լողավազանի բաժին և թվեր' },
  { key: 'garden', title: '03 — Այգին', desc: 'Շերտավոր նկարներ և ծառատեսակներ' },
  { key: 'gallery', title: '04 — Պատկերասրահ', desc: 'Լուսանկարներ' },
  { key: 'visit', title: '05 — Այցելություն', desc: 'Ամրագրման ձև և կոնտակտներ' },
  { key: 'footer', title: 'Ստորին հատված', desc: 'Footer' },
  { key: 'nav', title: 'Նավիգացիա', desc: 'Մենյուի կետերի անվանումներ' },
  { key: 'ui', title: 'Կոճակներ և մակագրություններ', desc: 'Ինտերֆեյսի փոքր տեքստեր' },
  { key: 'meta', title: 'SEO', desc: 'Էջի վերնագիր և նկարագրություն որոնողական համակարգերի համար' },
]

export const LABELS = {
  title: 'Վերնագիր',
  description: 'Նկարագրություն',
  name: 'Անուն',
  kind: 'Տեսակ',
  since: 'Հիմնադրման տարի',
  place: 'Վայր',
  coords: 'Կոորդինատներ',
  altitude: 'Բարձրություն',
  season: 'Սեզոն',
  hours: 'Աշխատանքային ժամեր',
  phone: 'Հեռախոս',
  email: 'Էլ. փոստ',
  address: 'Հասցե',
  items: 'Տարրեր',
  label: 'Անվանում',
  reserve: '«Ամրագրել» կոճակ',
  image: 'Նկար',
  plate: 'Փոքր ուղղահայաց նկար',
  plateTime: 'Փոքր նկարի ժամը',
  plateCaption: 'Փոքր նկարի մակագրություն',
  waterTemp: 'Ջրի ջերմաստիճան',
  seal: 'Կլոր կոճակի տեքստ',
  plateA: 'Նկար 1 (աջ, վերև)',
  plateATime: 'Նկար 1-ի ժամը',
  plateAMeta: 'Նկար 1-ի մակագրություն',
  plateB: 'Նկար 2 (ձախ, մեծ)',
  paragraphs: 'Պարբերություններ',
  signature: 'Ստորագրություն',
  specs: 'Տվյալների տող',
  value: 'Արժեք',
  aside: 'Կողային մակագրություն',
  hint: 'Հուշում նկարի վրա',
  lead: 'Հիմնական պարբերություն',
  body: 'Տեքստ',
  stats: 'Թվեր',
  unit: 'Միավոր',
  imageBack: 'Հետին փոքր նկար',
  imageMid: 'Մեծ նկար',
  imageMidCaption: 'Մեծ նկարի մակագրություն',
  imageMidMeta: 'Մեծ նկարի լրացուցիչ նշում',
  imageFront: 'Առջևի քառակուսի նկար',
  tag: 'Փոքր մակագրություն',
  species: 'Ծառատեսակներ (շարժվող տող)',
  when: 'Ժամ',
  text: 'Նկարագրություն',
  ratio: 'Համամասնություն',
  caption: 'Մակագրություն',
  form: 'Ամրագրման ձև',
  namePlaceholder: 'Անվան դաշտի հուշում',
  date: 'Ամսաթիվ',
  party: 'Հյուրերի քանակ',
  submit: 'Ուղարկելու կոճակ',
  fineprint: 'Մանրատառ',
  sent: 'Ուղարկելուց հետո հաղորդագրություն',
  again: '«Ուղարկել ևս մեկը»',
  where: '«Որտեղ»',
  hoursLabel: '«Ժամեր»',
  hoursNote: 'Ժամերի նշում',
  speak: '«Կապ»',
  blurb: 'Կարճ նկարագրություն',
  gardenLabel: 'Սյունակ 1-ի վերնագիր',
  sectionsLabel: 'Սյունակ 2-ի վերնագիր',
  elsewhereLabel: 'Սյունակ 3-ի վերնագիր',
  reachLabel: 'Սյունակ 4-ի վերնագիր',
  links: 'Հղումներ',
  href: 'Հղում (URL կամ #բաժին)',
  back: '«Վերև» կոճակ',
  skip: '«Անցնել բովանդակությանը»',
  est: '«Հիմն.»',
  local: '«տեղական» (ժամ)',
  water: '«ջուր» (ջերմաստիճան)',
  scroll: '«Թերթել»',
  menuOpen: 'Մենյուի բացում (էկրանընթերցիչ)',
  menuClose: 'Մենյուի փակում (էկրանընթերցիչ)',
  prev: '«Նախորդ»',
  next: '«Հաջորդ»',
  close: '«Փակել»',
  view: '«Դիտել»',
  touch: '«Դիպչել»',
  send: '«Ուղարկել»',
  language: '«Լեզու»',
  id: 'Բաժնի ID',
  alt: 'Նկարի նկարագրություն (տեսողության խնդիրներով մարդկանց և Google-ի համար)',
}

const RICH = 'Նոր տող՝ Enter։ Շեղ ընդգծում՝ *բառը* աստղանիշների մեջ։'

export const HINTS = {
  'hero.title': RICH,
  'water.title': RICH,
  'garden.title': RICH,
  'visit.title': RICH,
  'hero.image':
    'Այս նկարից է ստեղծվում շարժվող ջրի էֆեկտը։ Լավագույնը՝ ջրի մակերեսի մոտիկ, մուգ կադր։',
  'water.image': 'Լայն հորիզոնական կադր։ Ջրի էֆեկտը կիրառվում է ամբողջ նկարի վրա։',
  'visit.image': 'Ֆոնային նկար՝ մգացված։ Երեկոյան կադրերն են լավագույնը։',
  'brand.name': 'Լատինատառ։ Կայքում ցուցադրվում է մեծատառերով։',
  'brand.address': 'Յուրաքանչյուր տող՝ նոր տողից։',
  'gallery.aside': '{n}-ն ավտոմատ փոխարինվում է նկարների քանակով։',
  'nav.items': 'Բաժինների հերթականությունը ֆիքսված է, կարող եք փոխել միայն անվանումները։',
}

/** Lists whose length is tied to the page structure. */
export const FIXED_LISTS = ['nav.items']

export const READONLY_KEYS = ['id']

export const RATIOS = [
  { value: '4 / 5', label: 'Ուղղահայաց 4:5' },
  { value: '3 / 4', label: 'Ուղղահայաց 3:4' },
  { value: '1 / 1', label: 'Քառակուսի 1:1' },
  { value: '3 / 2', label: 'Հորիզոնական 3:2' },
  { value: '16 / 9', label: 'Լայն 16:9' },
]

export const labelFor = (key) => LABELS[key] || key
