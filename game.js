(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const game = new CatGame.Game();
  const excuses = ['猫は入れていません。たぶん。','そちらは猫ではなく、ふわふわの椅子です。','猫を除外しました。別の猫を追加しました。','プロンプトを理解しました。理解した猫です。','不具合ではありません。かわいさです。','学習データの97％が猫でした。','「猫なし」を「猫、増し」と解釈しました。','修正しました。にゃお、個体差があります。','人間による確認が必要です。猫でも可。'];
  let clock, transition, feedbackTimer, disposed = false;
  function drawBoard() {
    $('prompt').textContent = game.theme.prompt;
    $('app').dataset.theme = game.round % 6;
    $('grid').replaceChildren(...game.cells.map((cell, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tile'; b.dataset.index = i; b.style.setProperty('--i', i);
      b.setAttribute('aria-label', cell.name); b.innerHTML = '<span class="emoji" aria-hidden="true"></span><span class="tile-pop" aria-hidden="true"></span>';
      b.firstElementChild.textContent = cell.emoji;
      return b;
    }));
    $('grid').classList.remove('cleared'); $('status').textContent = game.phase === 'ready' ? 'タップで20秒スタート' : '生成 ' + (game.round + 1) + ' 枚目｜猫がまた混入';
    $('progress-label').textContent = '修正待ち';
    $('feedback').textContent = '猫だけタップ！ 猫以外はそのまま。';
    update();
  }
  function update() {
    $('score').textContent = game.score;
    $('time').textContent = game.seconds(performance.now());
    $('time-fill').style.width = game.seconds(performance.now()) / 20 * 100 + '%';
    $('time').classList.toggle('urgent', game.seconds(performance.now()) <= 5);
    $('combo').textContent = '×' + Math.min(5, 1 + Math.floor(Math.max(0, game.combo - 1) / 5));
    $('combo-label').textContent = game.combo ? game.combo + ' 匹連続修正' : '猫だけ連続で';
    $('remaining').textContent = '猫 ' + game.remaining + ' 匹';
  }
  function say(text) { $('excuse').textContent = text; }
  function finish() {
    if (disposed) return; disposed = true;
    clearInterval(clock); clearTimeout(transition); clearTimeout(feedbackTimer);
    document.querySelectorAll('.tile').forEach(b => b.disabled = true);
    $('app').classList.add('finished'); $('result').hidden = false;
    $('final-score').textContent = game.score;
    $('result-title').textContent = game.hits >= 40 ? '猫より速い、修正のプロ。' : game.hits >= 22 ? 'AIの尻ぬぐい職人。' : game.hits >= 10 ? '猫、見逃せないタイプ。' : '猫にやさしい監督さん。';
    $('result-stats').textContent = game.hits + ' 匹修正 ／ ' + game.clears + ' 枚完成 ／ お手つき ' + game.misses + ' 回';
    $('report').textContent = game.misses > 5 ? '猫以外も消えていますが、芸術として納品します。' : game.clears >= 5 ? 'ご協力ありがとうございました。次回は猫を倍にします。' : '修正を学習しました。次も同じ猫を出します。';
    $('result-title').focus({preventScroll:true});
  }
  function tap(button) {
    if (disposed) return;
    const action = game.tap(Number(button.dataset.index), performance.now());
    if (game.phase === 'done') { finish(); return; }
    if (!action) return;
    clearTimeout(feedbackTimer);
    document.querySelectorAll('.tile.wrong').forEach(tile => { tile.classList.remove('wrong'); tile.querySelector('.tile-pop').textContent = ''; });
    const pop = button.querySelector('.tile-pop');
    button.classList.remove('wrong'); void button.offsetWidth;
    if (action.hit) {
      button.disabled = true; button.classList.add('fixed'); button.setAttribute('aria-label','修正済み');
      $('score').classList.remove('pop-score'); void $('score').offsetWidth; $('score').classList.add('pop-score');
      button.firstElementChild.textContent = '✦'; pop.textContent = '+' + action.points;
      $('feedback').textContent = game.combo >= 6 ? game.combo + ' 連続！ 修正の手が止まらない' : 'ぽいっ！ 猫を修正 ＋' + action.points;
      if (game.hits % 5 === 0) say(excuses[Math.floor(game.hits / 5) % excuses.length]);
      if (action.clear) {
        $('grid').classList.add('cleared'); $('progress-label').textContent = '修正完了！'; $('status').textContent = 'よし、猫はいない！'; $('feedback').textContent = 'にゃいす！ 全部修正 ＋50 ★';
        transition = setTimeout(() => { if (game.next(performance.now())) { drawBoard(); say(excuses[(game.round + 1) % excuses.length]); } else if (game.phase === 'done') finish(); }, 420);
      }
    } else {
      button.classList.add('wrong'); pop.textContent = '−20';
      $('feedback').textContent = 'それは' + action.name + 'です！ −20'; say('今のは猫ではありません。そこは自信あります。');
      feedbackTimer = setTimeout(() => { button.classList.remove('wrong'); pop.textContent = ''; }, 600);
    }
    if (!action.clear) $('status').textContent = '生成 ' + (game.round + 1) + ' 枚目｜猫が混入しています';
    update();
  }
  $('grid').addEventListener('pointerdown', event => {
    const button = event.target.closest('.tile');
    if (!button || !event.isPrimary || event.button !== 0) return;
    event.preventDefault(); tap(button);
  });
  $('grid').addEventListener('click', event => { const button = event.target.closest('.tile'); if (button && event.detail === 0) tap(button); });
  $('grid').addEventListener('contextmenu', event => event.preventDefault());
  function reset() {
    clearInterval(clock); clearTimeout(transition); clearTimeout(feedbackTimer); disposed = false;
    game.reset(); $('app').classList.remove('finished'); $('result').hidden = true;
    $('feedback').textContent = '猫だけタップ！ 猫以外はそのまま。'; say(excuses[0]); drawBoard();
    clock = setInterval(() => { if (game.tick(performance.now())) finish(); else update(); }, 100);
  }
  $('retry').addEventListener('click', reset);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && game.tick(performance.now())) finish(); });
  reset();
})();
