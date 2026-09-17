(function(root) {
  'use strict';
  const themes = [
    { prompt: '緑いっぱいの、おしゃれなカフェ。', items: [['☕','コーヒー'],['🥐','クロワッサン'],['🪴','観葉植物'],['🪑','椅子'],['🍰','ケーキ'],['🧋','ドリンク']] },
    { prompt: '猫のいない、壮大な宇宙。', items: [['🪐','惑星'],['🚀','ロケット'],['🌍','地球'],['⭐','星'],['🛰️','人工衛星'],['🌙','月']] },
    { prompt: 'おいしそうな朝ごはんの写真。', items: [['🍞','パン'],['🍳','目玉焼き'],['🥛','ミルク'],['🥑','アボカド'],['🍓','いちご'],['🥣','シリアル']] },
    { prompt: 'すっきり片づいた、仕事のデスク。', items: [['💻','パソコン'],['📚','本'],['✏️','えんぴつ'],['🖱️','マウス'],['📎','クリップ'],['☕','コーヒー']] },
    { prompt: 'のどかな海辺のバカンス。', items: [['🏝️','島'],['🐚','貝'],['🦀','カニ'],['⛵','ヨット'],['🌊','波'],['🩴','サンダル']] },
    { prompt: '色とりどりの、きれいな花壇。', items: [['🌷','チューリップ'],['🌻','ひまわり'],['🌹','バラ'],['🦋','ちょうちょ'],['🌼','花'],['🌱','芽']] }
  ];
  class Game {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() { this.phase = 'ready'; this.startAt = null; this.score = 0; this.hits = 0; this.misses = 0; this.combo = 0; this.bestCombo = 0; this.round = 0; this.clears = 0; this.makeBoard(); }
    makeBoard() {
      this.theme = themes[this.round % themes.length];
      const cats = Math.min(5, 3 + Math.floor(this.round / 2));
      const catIcons = ['🐱','😺','🐈','😼'];
      this.cells = Array.from({ length: 9 }, (_, i) => i < cats ? { cat: true, emoji: catIcons[Math.floor(this.random() * catIcons.length)], name: '猫', fixed: false } : { cat: false, emoji: this.theme.items[(i - cats) % this.theme.items.length][0], name: this.theme.items[(i - cats) % this.theme.items.length][1], fixed: false });
      for (let i = 8; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [this.cells[i], this.cells[j]] = [this.cells[j], this.cells[i]]; }
      this.remaining = cats;
    }
    seconds(now) { return this.startAt === null ? 20 : Math.max(0, Math.ceil((20000 - (now - this.startAt)) / 1000)); }
    tick(now) { if (this.startAt !== null && now - this.startAt >= 20000) this.phase = 'done'; return this.phase === 'done'; }
    tap(index, now) {
      if (this.tick(now) || this.phase === 'clearing') return null;
      const cell = this.cells[index]; if (!cell || cell.fixed) return null;
      if (this.phase === 'ready') { this.phase = 'playing'; this.startAt = now; }
      if (!cell.cat) { this.misses++; this.combo = 0; this.score = Math.max(0, this.score - 20); return { hit: false, name: cell.name, points: -20 }; }
      cell.fixed = true; this.hits++; this.combo++; this.bestCombo = Math.max(this.bestCombo, this.combo);
      const multiplier = Math.min(5, 1 + Math.floor((this.combo - 1) / 5));
      const points = 10 * multiplier; this.score += points; this.remaining--;
      if (!this.remaining) { this.score += 50; this.clears++; this.phase = 'clearing'; }
      return { hit: true, points, clear: this.remaining === 0 };
    }
    next(now) { if (this.tick(now) || this.phase !== 'clearing') return false; this.round++; this.makeBoard(); this.phase = 'playing'; return true; }
  }
  root.CatGame = { Game, themes };
  if (typeof module !== 'undefined') module.exports = root.CatGame;
})(typeof window !== 'undefined' ? window : globalThis);
