document.addEventListener('DOMContentLoaded', () => {
    const slots = [
        document.getElementById("slot1"),
        document.getElementById("slot2"),
        document.getElementById("slot3")
    ];
    const spinButton = document.getElementById("spinButton");
    const resultDiv = document.getElementById("result");
    const confettiContainer = document.getElementById("confettiContainer");

    // 効果音
    const bgm = document.getElementById("bgm");
    const soundStart = document.getElementById("soundStart");
    const soundStop = document.getElementById("soundStop");
    const soundWin = document.getElementById("soundWin");
    const soundLose = document.getElementById("soundLose");

    // パチスロ風の絵柄（Unicode絵文字や短い単語でもOK）
    // ロゴなどを表示したい場合は、HTMLのimgタグを返すようにする
    const chars = [
        "内", "定", "！", "💮", "✨", "🌸", // 当たり関連
        "落", "選", "×", "泣", "不", "🆖", // 失敗関連
        "💰", "🍀", "💎", "🎯" // その他
    ];

    const winChars = ["内", "定", "！"]; // 当たり判定に使う正確な文字
    const winProbability = 0.90; // 内定！が揃う確率 (90%)

    let slotIntervals = []; // 各スロットの setInterval ID を格納
    let slotValues = [];    // 最終的に停止したスロットの値を格納
    let currentSpinCount = 0; // スピン中のスロット数

    // 背景画像の設定
    const backgrounds = [
        'images/bg1.jpg',
        'images/bg2.jpg',
        'images/bg3.jpg'
    ];

    function setRandomBackground() {
        const randomIndex = Math.floor(Math.random() * backgrounds.length);
        document.body.style.backgroundImage = `url('${backgrounds[randomIndex]}')`;
    }

    // 初期背景設定とBGM再生を促す
    setRandomBackground();
    bgm.volume = 0.3; // BGM音量
    soundStart.volume = 0.5;
    soundStop.volume = 0.6;
    soundWin.volume = 0.8;
    soundLose.volume = 0.7;

    // ユーザーインタラクションがないとBGMが自動再生されないため、ボタンクリックで開始
    spinButton.addEventListener('click', () => {
        if (bgm.paused) {
            bgm.play().catch(e => console.log("BGM再生エラー:", e));
        }
        startSlot();
    });

    // ランダムな絵柄を取得
    function getRandomChar() {
        return chars[Math.floor(Math.random() * chars.length)];
    }

    // スロットの停止ロジック
    function stopSlot(slotElement, index, isFinalStop) {
        clearInterval(slotIntervals[index]); // このスロットの回転を止める

        let charToDisplay;
        const willWin = Math.random() < winProbability; // 全体での当たり判定

        if (isFinalStop) {
            // 大当たりにするか、外れにするかを最終決定
            if (willWin && index === 0) {
                charToDisplay = winChars[0]; // 1番目のスロットを '内' に固定
            } else if (willWin && index === 1) {
                charToDisplay = winChars[1]; // 2番目のスロットを '定' に固定
            } else if (willWin && index === 2) {
                charToDisplay = winChars[2]; // 3番目のスロットを '！' に固定
            } else {
                // 外れの場合、確実に当たり以外の組み合わせにする
                // ここでは、'内定！' にならないようにランダムに選ぶ
                let nonWinChars = chars.filter(c => !winChars.includes(c));
                charToDisplay = nonWinChars[Math.floor(Math.random() * nonWinChars.length)];
                // 既に一部が当たりの組み合わせになっていたら、そこを崩す
                if (index > 0 && slotValues[index-1] === winChars[index-1]) {
                    // 直前のスロットが当たり文字の場合、現在のスロットは確実に外れにする
                    charToDisplay = nonWinChars[Math.floor(Math.random() * nonWinChars.length)];
                }
            }
        } else {
            charToDisplay = getRandomChar(); // 回転中は完全ランダム
        }

        slotElement.textContent = charToDisplay;
        // 特定の文字にCSSクラスを付与して色分けする (例: '内'なら.char-内)
        slotElement.className = 'slot'; // クラスをリセット
        if (charToDisplay.length === 1) { // 1文字の場合のみクラスを付与
            slotElement.classList.add(`char-${charToDisplay}`);
        }
        
        slotValues[index] = charToDisplay; // 最終値を保存
        soundStop.currentTime = 0;
        soundStop.play();

        currentSpinCount++;
        if (currentSpinCount === slots.length) {
            // 全てのスロットが停止したら結果を判定
            checkResult();
        }
    }

    function startSlot() {
        // リセット処理
        resultDiv.textContent = "回転中...";
        spinButton.disabled = true;
        document.body.className = ""; // Win/Lose背景をリセット
        slots.forEach(slot => {
            slot.textContent = "？";
            slot.classList.remove("win-glow"); // 光るアニメーションをリセット
            slot.className = 'slot'; // 文字色クラスもリセット
        });
        slotValues = [];
        slotIntervals.forEach(clearInterval); // 前回のインターバルをクリア
        slotIntervals = [];
        currentSpinCount = 0;
        confettiContainer.innerHTML = ''; // 紙吹雪をクリア
        
        soundStart.currentTime = 0;
        soundStart.play(); // 回転開始音

        // 各スロットを回転させる
        slots.forEach((slot, index) => {
            let count = 0;
            const maxSpins = 30 + index * 10; // スロットごとに回転数を増やす
            const spinSpeed = 70; // 回転速度

            slotIntervals[index] = setInterval(() => {
                slot.textContent = getRandomChar();
                // 一時的な文字色付け (オプション)
                slot.className = 'slot';
                if (slot.textContent.length === 1) {
                    slot.classList.add(`char-${slot.textContent}`);
                }
                count++;
                if (count >= maxSpins) {
                    // 回転し終わった後、少しだけランダムに回すフェーズ
                    stopSlot(slot, index, false); // ここではまだ最終結果は決めない
                }
            }, spinSpeed);

            // タイムアウトでスロットを最終停止させる
            const stopDelay = [1000, 1800, 2600]; // 停止タイミングの調整
            setTimeout(() => {
                stopSlot(slot, index, true); // 最終結果を決定して停止
            }, stopDelay[index]);
        });
    }

    function checkResult() {
        const finalResult = slotValues.join('');
        const flashEffect = document.createElement('div');
        flashEffect.classList.add('flash-effect');

        if (finalResult === winChars.join('')) {
            resultDiv.textContent = "🎉 おめでとう！内定です！ 🎉";
            document.body.classList.add("win-bg");
            slots.forEach(slot => slot.classList.add("win-glow"));

            // 大当たり演出
            document.body.appendChild(flashEffect);
            soundWin.currentTime = 0;
            soundWin.play();
            setTimeout(() => {
                document.body.removeChild(flashEffect);
            }, 300); // フラッシュの時間

            // 紙吹雪を降らせる
            for (let i = 0; i < 100; i++) {
                createConfetti();
            }
        } else {
            resultDiv.textContent = "😢 残念…再挑戦してみよう！ 😢";
            // 負け背景はランダムに切り替え
            setRandomBackground();
            soundLose.currentTime = 0;
            soundLose.play();
            // 負け時の背景はCSSでbodyに設定されたもの（初期のランダム背景）に戻る
            // document.body.classList.add("lose-bg"); // 今回は勝った時だけ背景が変わるようにする
        }
        spinButton.disabled = false; // ボタンを再度有効化
    }

    // 紙吹雪生成関数
    function createConfetti() {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = Math.random() * 100 + 'vw'; // 画面幅全体
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`; // カラフル
        confetti.style.animationDelay = -Math.random() * 3 + 's'; // バラバラに降らせる
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's'; // 落下時間
        confettiContainer.appendChild(confetti);

        // アニメーション終了後に要素を削除してDOMをクリーンアップ
        confetti.addEventListener('animationend', () => {
            confetti.remove();
        });
    }
});