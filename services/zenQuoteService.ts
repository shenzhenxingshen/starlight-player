
export interface ZenQuote {
  text: string;
  source: string;
}

const ZEN_QUOTES: ZenQuote[] = [
 
  // --- 印光大师《文钞》 ---
  { text: "真为生死，发菩提心。以深信愿，持佛名号。", source: "印光大师《文钞》" },
  { text: "敦伦尽分，闲邪存诚，诸恶莫作，众善奉行。", source: "印光大师《文钞》" },
  { text: "欲得佛法实益，须向恭敬中求。有一分恭敬，则消一分罪业，增一分福慧。", source: "印光大师《文钞》" },
  { text: "念佛方能消宿业，竭诚自可转凡心。", source: "印光大师《文钞》" },
  { text: "所谓心不贪恋，意不颠倒，即归命投诚之真诚心。", source: "印光大师《文钞》" },
  { text: "诚与恭敬，实为修行之要径。", source: "印光大师《文钞》" },
  { text: "心地清净，便是极乐。众生心水净，影现对中。", source: "印光大师《文钞》" },
  { text: "佛力不可思议，愿力不可思议。", source: "印光大师《文钞》" },
  { text: "看破世间，放下五欲，死尽偷心，方能成佛。", source: "印光大师《文钞》" },
  { text: "净土法门，横超三界，念佛之乐，非世间乐所能及。", source: "印光大师《文钞》" },
  { text: "一句弥陀，万德洪名，唯有念佛，最稳当便捷。", source: "印光大师《文钞》" },
  { text: "生则决定生，去则实不去。", source: "印光大师《文钞》" },
  { text: "极乐世界，即在自心中。", source: "印光大师《文钞》" },
  { text: "念佛一声，罪灭河沙；礼佛一拜，福增无量。", source: "印光大师《文钞》" },
  { text: "佛号所在，即是道场。", source: "印光大师《文钞》" },
  { text: "老实念佛，莫换题目。", source: "印光大师《文钞》" },
  { text: "莫道念佛容易，成就者鲜，皆由信愿不切。", source: "印光大师《文钞》" },
  { text: "佛号入耳，宿根增长。", source: "印光大师《文钞》" },
  { text: "持咒持名，皆是调心。心平气和，便是修行。", source: "印光大师《文钞》" },
  { text: "万缘放下，一心念佛。", source: "印光大师《文钞》" },
  { text: "佛心者，大慈悲是。", source: "印光大师《文钞》" },
  { text: "心念佛时，即是佛时。", source: "印光大师《文钞》" },
  { text: "随缘消旧业，更不造新殃。", source: "印光大师《文钞》" },
  { text: "利钝全收，三根普被，最胜方便。", source: "印光大师《文钞》" }
];

export const getZenQuote = (): ZenQuote => {
  const randomIndex = Math.floor(Math.random() * ZEN_QUOTES.length);
  return ZEN_QUOTES[randomIndex];
};
