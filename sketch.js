let ssIdle, ssWalk, ssAction, ssCast, ssProjectile, ssNewChar, ssFall, ssSmile; // 新增施法、投射物與新角色的 Sprite Sheet
const animIdle = [];
const animWalk = [];
const animPlayerCast = []; // 角色1的施法動畫 (原 animAction)
const animImpact = []; // 爆炸效果 (原 animCast)
const animProjectile = [];
const animNewChar = []; // 新增：新角色的動畫陣列
const animFall = []; // 新增：角色2倒下的動畫陣列
const animSmile = []; // 新增：角色2微笑的動畫陣列

// 站立動畫的設定
const IDLE_SS_WIDTH = 1115;
const IDLE_SS_HEIGHT = 46;
const IDLE_FRAME_COUNT = 14;

// 走路動畫的設定
const WALK_SS_WIDTH = 605;
const WALK_SS_HEIGHT = 60;
const WALK_FRAME_COUNT = 10;

// 新增：角色1施法動畫的設定
const PLAYER_CAST_SS_WIDTH = 443;
const PLAYER_CAST_SS_HEIGHT = 53;
const PLAYER_CAST_FRAME_COUNT = 7;

// 新增：爆炸效果動畫的設定
const IMPACT_SS_WIDTH = 124;
const IMPACT_SS_HEIGHT = 37;
const IMPACT_FRAME_COUNT = 3;

// 新增：投射物動畫的設定
const PROJECTILE_SS_WIDTH = 225;
const PROJECTILE_SS_HEIGHT = 40;
const PROJECTILE_FRAME_COUNT = 5;

// 新增：新角色的動畫設定
const NEWCHAR_SS_WIDTH = 107;
const NEWCHAR_SS_HEIGHT = 40;
const NEWCHAR_FRAME_COUNT = 4;

// 新增：角色2倒下動畫的設定
const FALL_SS_WIDTH = 115;
const FALL_SS_HEIGHT = 37;
const FALL_FRAME_COUNT = 4;

// 新增：角色2微笑動畫的設定 (假設尺寸與站立相似)
const SMILE_SS_WIDTH = 107;
const SMILE_SS_HEIGHT = 40;
const SMILE_FRAME_COUNT = 4;


// 新增：角色放大倍率
const SCALE_FACTOR = 2.5;

// 角色狀態
let charX, charY;
let speed = 10; // 增加角色移動速度
let direction = 1; // 1 for right, -1 for left

// 新增：新角色的位置
let newCharX, newCharY;

// 新增：對話系統變數
let playerInput; // 玩家的文字輸入框
let npcDialogue = "需要我解答嗎?"; // 角色2的對話內容
let isInDialogueRange = false; // 追蹤是否在對話範圍內
let isNpcHit = false; // 新增：追蹤角色2是否被擊中
let npcHitTimer = 0; // 新增：NPC被擊中時的計時器
const npcRecoveryTime = 3000; // 新增：NPC恢復時間 (3秒)
const impactEffects = []; // 新增：存放爆炸效果的陣列

// --- 測驗相關變數 ---
let quizTable; // 由 CSV 載入的表格
let questions = []; // 解析後的題庫陣列
let currentQuestion = null; // 目前出題
let questionAnswered = false; // 是否已回答（用於控制不立即重抽）
let npcSubtext = ''; // 對話框的次要文字（例如提示），會被截斷到最多 8 字

// 豐富的正/負回覆選項（每項皆短於或等於 8 字）
const positiveReplies = [
  '太棒了', '好厲害', '正確喔', '幹得漂亮', '答對啦', '真聰明', '超棒', '你最棒'
];
const negativeReplies = [
  '再試一次', '不對喔', '差一點', '再想想', '再來一次', '別放棄', '小錯誤', '加油喔'
];


// 新增：跳躍相關物理變數
let isJumping = false;
let velocityY = 0;
const gravity = 0.6;
const jumpForce = -15; // 負數表示向上
let groundY;

// 新增：施法狀態
let isCasting = false;
let castFrameCounter = 0;

// 新增：投射物管理
const projectiles = [];
const projectileSpeed = 12;

// 預先載入資源
function preload() {
  // 載入站立、走路和新動作的圖片精靈
  ssIdle = loadImage('1/1all.png');
  ssWalk = loadImage('2/2all.png');
  ssAction = loadImage('3/3all.png'); // 跳躍動畫使用 '3/3all.png'
  ssCast = loadImage('4/4all.png');
  ssProjectile = loadImage('5/5all.png');
  ssNewChar = loadImage('6/stop/6-1.png'); // 載入新角色的圖片
  ssFall = loadImage('6/fall/6-3.png'); // 載入新角色倒下的圖片
  ssSmile = loadImage('6/smile/6-2.png'); // 載入新角色微笑的圖片
  // 載入測驗卷 CSV（header 格式）
  quizTable = loadTable('quiz.csv', 'csv', 'header');
}

function setup() {
  // 建立一個全螢幕的畫布
  createCanvas(windowWidth, windowHeight);

  // 初始化角色位置
  charX = width / 2;
  groundY = height / 2; // 將初始Y設為地面
  charY = groundY;

  // 新增：初始化新角色的位置
  newCharX = charX - 150; // 在主角色左邊 150px
  newCharY = groundY;

  // 新增：創建文字輸入框並隱藏
  playerInput = createInput('');
  playerInput.hide();
  playerInput.attribute('placeholder', '輸入數字答案並按 Enter');
  playerInput.size(120, 24);
  // 當輸入完成 (按下Enter或失去焦點) 時，觸發 updateNpcDialogue 函式
  playerInput.changed(updateNpcDialogue);

  // 解析 quizTable（若有載入）為 questions 陣列
  if (quizTable && quizTable.getRowCount && quizTable.getRowCount() > 0) {
    for (let r = 0; r < quizTable.getRowCount(); r++) {
      const row = quizTable.getRow(r);
      questions.push({
        question: row.get('question'),
        answer: row.get('answer'),
        correct_feedback: row.get('correct_feedback'),
        wrong_feedback: row.get('wrong_feedback'),
        hint: row.get('hint')
      });
    }
  }


  // --- 處理站立動畫 ---
  const idleFrameWidth = IDLE_SS_WIDTH / IDLE_FRAME_COUNT;
  for (let i = 0; i < IDLE_FRAME_COUNT; i++) {
    let frame = ssIdle.get(i * idleFrameWidth, 0, idleFrameWidth, IDLE_SS_HEIGHT);
    animIdle.push(frame);
  }

  // --- 處理走路動畫 ---
  const walkFrameWidth = WALK_SS_WIDTH / WALK_FRAME_COUNT;
  for (let i = 0; i < WALK_FRAME_COUNT; i++) {
    let frame = ssWalk.get(i * walkFrameWidth, 0, walkFrameWidth, WALK_SS_HEIGHT);
    animWalk.push(frame);
  }

  // --- 處理角色1施法動畫 ---
  const playerCastFrameWidth = PLAYER_CAST_SS_WIDTH / PLAYER_CAST_FRAME_COUNT;
  for (let i = 0; i < PLAYER_CAST_FRAME_COUNT; i++) {
    let frame = ssAction.get(i * playerCastFrameWidth, 0, playerCastFrameWidth, PLAYER_CAST_SS_HEIGHT);
    animPlayerCast.push(frame);
  }

  // --- 處理爆炸效果動畫 ---
  const impactFrameWidth = IMPACT_SS_WIDTH / IMPACT_FRAME_COUNT;
  for (let i = 0; i < IMPACT_FRAME_COUNT; i++) {
    let frame = ssCast.get(i * impactFrameWidth, 0, impactFrameWidth, IMPACT_SS_HEIGHT);
    animImpact.push(frame);
  }

  // --- 處理投射物動畫 ---
  const projectileFrameWidth = PROJECTILE_SS_WIDTH / PROJECTILE_FRAME_COUNT;
  for (let i = 0; i < PROJECTILE_FRAME_COUNT; i++) {
    let frame = ssProjectile.get(i * projectileFrameWidth, 0, projectileFrameWidth, PROJECTILE_SS_HEIGHT);
    animProjectile.push(frame);
  }

  // --- 處理新角色的動畫 ---
  // 新增：移除背景色
  // 遍歷圖片的每個像素，將洋紅色背景變為透明
  ssNewChar.loadPixels();
  for (let i = 0; i < ssNewChar.pixels.length; i += 4) {
    // 檢查是否為洋紅色 (R:255, G:0, B:255)
    if (ssNewChar.pixels[i] === 255 && ssNewChar.pixels[i + 1] === 0 && ssNewChar.pixels[i + 2] === 255) {
      // 將其 alpha 值設為 0 (完全透明)
      ssNewChar.pixels[i + 3] = 0;
    }
  }
  ssNewChar.updatePixels();

  const newCharFrameWidth = NEWCHAR_SS_WIDTH / NEWCHAR_FRAME_COUNT;
  for (let i = 0; i < NEWCHAR_FRAME_COUNT; i++) {
    let frame = ssNewChar.get(i * newCharFrameWidth, 0, newCharFrameWidth, NEWCHAR_SS_HEIGHT);
    animNewChar.push(frame);
  }

  // --- 處理倒下動畫 ---
  // 新增：移除背景色
  ssFall.loadPixels();
  for (let i = 0; i < ssFall.pixels.length; i += 4) {
    // 檢查是否為洋紅色 (R:255, G:0, B:255)
    if (ssFall.pixels[i] === 255 && ssFall.pixels[i + 1] === 0 && ssFall.pixels[i + 2] === 255) {
      // 將其 alpha 值設為 0 (完全透明)
      ssFall.pixels[i + 3] = 0;
    }
  }
  ssFall.updatePixels();
  const fallFrameWidth = FALL_SS_WIDTH / FALL_FRAME_COUNT;
  for (let i = 0; i < FALL_FRAME_COUNT; i++) {
    let frame = ssFall.get(i * fallFrameWidth, 0, fallFrameWidth, FALL_SS_HEIGHT);
    animFall.push(frame);
  }

  // --- 處理微笑動畫 ---
  // 新增：移除背景色
  ssSmile.loadPixels();
  for (let i = 0; i < ssSmile.pixels.length; i += 4) {
    // 檢查是否為洋紅色 (R:255, G:0, B:255)
    if (ssSmile.pixels[i] === 255 && ssSmile.pixels[i + 1] === 0 && ssSmile.pixels[i + 2] === 255) {
      // 將其 alpha 值設為 0 (完全透明)
      ssSmile.pixels[i + 3] = 0;
    }
  }
  ssSmile.updatePixels();
  const smileFrameWidth = SMILE_SS_WIDTH / SMILE_FRAME_COUNT;
  for (let i = 0; i < SMILE_FRAME_COUNT; i++) {
    let frame = ssSmile.get(i * smileFrameWidth, 0, smileFrameWidth, SMILE_SS_HEIGHT);
    animSmile.push(frame);
  }

  // 設定動畫播放速度 (每秒 8 格)，放慢速度
  frameRate(8);

  // 讓圖片繪製的基準點在圖片的中心
  imageMode(CENTER);
}

// 新增：當玩家輸入後更新NPC對話的函式
function updateNpcDialogue() {
  const inputText = playerInput.value().trim();
  if (!currentQuestion) {
    // 若目前沒有題目，顯示輸入內容作為一般對話
    npcDialogue = `${inputText}, 歡迎你`;
    playerInput.value('');
    return;
  }

  // 嘗試將輸入解析為數字並比對答案
  const userAns = parseInt(inputText, 10);
  const correctAns = parseInt(currentQuestion.answer, 10);
  if (!isNaN(userAns) && userAns === correctAns) {
    // 隨機挑一個正向回覆，並確保最多 8 個字
    npcDialogue = truncateTo8(random(positiveReplies));
    npcSubtext = '';
    questionAnswered = true;
    // 清空輸入框
    playerInput.value('');
    // 在短暫延遲後抽下一題
    setTimeout(() => {
      pickRandomQuestion();
    }, 1400);
  } else {
    // 隨機挑一個負向回覆並截斷，提示也截斷至 8 字以符合要求
    npcDialogue = truncateTo8(random(negativeReplies));
    npcSubtext = truncateTo8(currentQuestion.hint || '提示');
    // 保留輸入框以便再次嘗試，並清空輸入
    playerInput.value('');
  }
}

// 從題庫隨機抽一題並設定為當前題目
function pickRandomQuestion() {
  if (!questions || questions.length === 0) return;
  const idx = floor(random(questions.length));
  currentQuestion = questions[idx];
  // 顯示題目為主回覆，次要文字清空
  npcDialogue = truncateTo8(currentQuestion.question);
  npcSubtext = '';
  questionAnswered = false;
}

// 將字串截斷為最多 8 個中文字（若超過則取前 8 字）
function truncateTo8(s) {
  if (!s) return '';
  // 簡單以字元數截斷；對於英文/混合情境可視作近似
  return s.toString().slice(0, 8);
}

// 使用 keyPressed 處理單次觸發的動作，如跳躍
function keyPressed() {
  // 跳躍
  if (keyCode === UP_ARROW && !isJumping) {
    isJumping = true;
    velocityY = jumpForce;
  }
  // 施法 (向下方向鍵)
  if (keyCode === DOWN_ARROW && !isJumping && !isCasting) {
    isCasting = true;
  }
}

function draw() {
  // 設定背景顏色
  background('#ff66d8');

  // --- 1. 物理計算 (處理跳躍) ---
  if (isJumping) {
    velocityY += gravity; // 重力持續影響速度
    charY += velocityY;   // 根據速度更新Y座標

    // 判斷是否落地
    if (charY >= groundY) {
      charY = groundY; // 確保角色不會掉到地面以下
      isJumping = false;
      velocityY = 0;
    }
  }

  // --- 2. 水平移動與方向更新 ---
  // 只有在不施法的時候才能移動
  let isWalking = false;
  if (!isCasting) {
    if (keyIsDown(RIGHT_ARROW)) {
      isWalking = true;
      direction = 1;
      charX += speed;
    } else if (keyIsDown(LEFT_ARROW)) {
      isWalking = true;
      direction = -1;
      charX -= speed;
    }
  }

  // --- 3. 根據狀態繪製角色 ---
  push();
  translate(charX, charY);
  if (direction === -1) {
    scale(-1, 1);
  }

  let frameToDraw;

  // 優先處理施法動畫
  if (isCasting) {
    const frameIndex = floor(castFrameCounter);

    // 檢查索引是否在動畫陣列範圍內
    if (frameIndex < PLAYER_CAST_FRAME_COUNT) {
      // 在施法期間，將要繪製的影格設定為施法動畫
      frameToDraw = animPlayerCast[frameIndex];
    }

    castFrameCounter += 0.5; // 控制施法動畫速度, 根據動畫幀數調整
    if (castFrameCounter >= PLAYER_CAST_FRAME_COUNT) {
      isCasting = false;
      castFrameCounter = 0;
      projectiles.push({ x: charX, y: charY, direction: direction });
      // 動畫結束後，立即根據當前移動狀態決定下一幀，避免卡住
      if (isWalking) {
        frameToDraw = animWalk[frameCount % animWalk.length];
      } else {
        frameToDraw = animIdle[frameCount % animIdle.length];
      }
    }

  // 如果不施法，才判斷其他狀態
  } else if (isJumping) {
    frameToDraw = animPlayerCast[frameCount % animPlayerCast.length]; // 跳躍時也使用此動畫
  } else if (isWalking) {
    frameToDraw = animWalk[frameCount % animWalk.length];
  } else { // idle
    frameToDraw = animIdle[frameCount % animIdle.length];
  }

  // 如果有需要繪製的影格，才進行繪製
  if (frameToDraw) {
    image(frameToDraw, 0, 0, frameToDraw.width * SCALE_FACTOR, frameToDraw.height * SCALE_FACTOR);
  }

  pop(); // 恢復到之前的繪圖狀態

  // 如果玩家在對話範圍內，於角色1 的對話框內顯示黃色提示（主文字為「請作答」，次文字為目前輸入）
  if (isInDialogueRange) {
    const inputTextForBox = (playerInput && playerInput.value) ? playerInput.value() : '';
    const main = '請作答';
    const sub = inputTextForBox;
    // 使用現有的 drawDialogueBox 以統一樣式，背景為黃色，文字為黑色
    drawDialogueBox(charX, charY - 150, main, '#FFD54A', '#000000', sub);
  }

  // --- 繪製新角色 ---
  // 檢查動畫是否都已載入
  if (animNewChar.length > 0 && animSmile.length > 0 && animFall.length > 0) {
    let frameToDrawNewChar;
    const proximityThreshold = 200; // 判斷為「接近」的距離 (像素)，增加觸發距離
    const distance = abs(charX - newCharX); // 計算兩個角色之間的距離
    const currentlyInRange = distance < proximityThreshold;

    // 檢查NPC是否應該從被擊中狀態恢復
    if (isNpcHit && millis() - npcHitTimer > npcRecoveryTime) {
      isNpcHit = false; // 恢復正常狀態
    }

    // 優先判斷是否被擊中
    if (isNpcHit) {
      frameToDrawNewChar = animFall[frameCount % animFall.length];
      playerInput.hide(); // 如果被擊中，隱藏輸入框
    } else {
      // 如果沒被擊中，才進行對話判斷
      if (currentlyInRange) {
        frameToDrawNewChar = animSmile[frameCount % animSmile.length];
        // 若還沒有題目則抽題
        if (!currentQuestion && !questionAnswered) {
          pickRandomQuestion();
        }
        // 繪製角色2的對話框（主文字 + 次要提示）
        drawDialogueBox(newCharX, newCharY - 100, npcDialogue, '#4281a4', '#ffede1', npcSubtext);

        // 顯示並定位玩家的輸入框
        playerInput.show();
        playerInput.position(charX - playerInput.width / 2, charY - 120);

        // 更新狀態
        isInDialogueRange = true;
      } else {
        // 否則，播放原本的站立動畫
        frameToDrawNewChar = animNewChar[frameCount % animNewChar.length];
        // 如果是剛從對話範圍離開，則隱藏輸入框並重設對話
        if (isInDialogueRange) {
          playerInput.hide();
          npcDialogue = "需要我解答嗎?"; // 重設NPC的對話
          // 離開對話範圍時重設當前題目
          currentQuestion = null;
          questionAnswered = false;
          npcSubtext = '';
          isInDialogueRange = false;
        }
      }
    }

    // 由於我們在 setup() 中設定了 imageMode(CENTER)，這裡的 x, y 座標就是圖片中心點
    // 直接在它的位置上繪製，不需 push/pop 或 translate，因為它不受翻轉影響
    image(frameToDrawNewChar, newCharX, newCharY, frameToDrawNewChar.width * SCALE_FACTOR, frameToDrawNewChar.height * SCALE_FACTOR);
  }

  // 最後，在所有角色繪圖邏輯結束後，才統一繪製投射物
  drawProjectiles();
  drawImpactEffects(); // 繪製爆炸效果
}

// 新增：繪製對話框的函式
function drawDialogueBox(x, y, textContent, bgColor, textColor, subText) {
  push(); // 儲存當前的繪圖設定

  // 設定文字樣式（主/次文字統一為 15）
  textFont('Arial'); // 可以換成你喜歡的字體
  textAlign(CENTER, CENTER);
  const mainSize = 15;
  const subSize = 15;
  textSize(mainSize);
  const mainW = textWidth(textContent || '');
  textSize(subSize);
  const subW = subText ? textWidth(subText) : 0;
  const textW = max(mainW, subW);
  const paddingX = 20;
  const lineHeight = mainSize + 6;
  const lines = subText ? 2 : 1;
  const boxWidth = (textW || 20) + paddingX;
  const boxHeight = lines * lineHeight + 12;

  // 繪製方框
  fill(bgColor);
  noStroke();
  rectMode(CENTER); // 讓 x, y 成為方框的中心點
  rect(x, y, boxWidth, boxHeight, 10); // 圓角方框

  // 繪製主文字
  fill(textColor);
  textSize(mainSize);
  if (subText) {
    // 兩行顯示：主文字在上、次要文字在下
    text(textContent, x, y - (lineHeight / 2));
    textSize(subSize);
    text(subText, x, y + (lineHeight / 2));
  } else {
    text(textContent, x, y);
  }

  pop(); // 恢復之前的繪圖設定
}

// 新增：繪製爆炸效果的函式
function drawImpactEffects() {
  for (let i = impactEffects.length - 1; i >= 0; i--) {
    const effect = impactEffects[i];
    
    // 播放爆炸動畫
    const frameIndex = floor(effect.frame); // 取得當前動畫幀的索引
    if (frameIndex < animImpact.length) {
      const effectFrame = animImpact[frameIndex];
      image(effectFrame, effect.x, effect.y, effectFrame.width * SCALE_FACTOR, effectFrame.height * SCALE_FACTOR);
    }

    // 更新動畫幀
    effect.frame += 0.5; // 控制爆炸動畫速度

    // 如果動畫播放完畢 (超過總幀數)，則移除
    if (effect.frame >= IMPACT_FRAME_COUNT) {
      impactEffects.splice(i, 1);
    }
  }
}

// 將投射物繪製邏輯提取為一個獨立函數
function drawProjectiles() {
  // --- 4. 更新並繪製所有投射物 ---
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    
    // 碰撞偵測
    const hitThreshold = 50; // 碰撞判定的距離
    if (!isNpcHit && dist(p.x, p.y, newCharX, newCharY) < hitThreshold) {
      isNpcHit = true; // 標記NPC被擊中
      npcHitTimer = millis(); // 開始計時
      impactEffects.push({ x: p.x, y: p.y, frame: 0 }); // 在碰撞點產生爆炸效果
      projectiles.splice(i, 1); // 移除投射物
      continue; // 繼續下一個迴圈，不再繪製這個已移除的投射物
    }

    p.x += projectileSpeed * p.direction;

    push();
    translate(p.x, p.y);
    if (p.direction === -1) {
      scale(-1, 1); // 如果投射物向左，則翻轉
    }
    const projectileFrame = animProjectile[frameCount % animProjectile.length];
    image(projectileFrame, 0, 0, projectileFrame.width * SCALE_FACTOR, projectileFrame.height * SCALE_FACTOR);
    pop();

    // 如果投射物飛出畫面，則從陣列中移除
    if (p.x > width + 100 || p.x < -100) {
      projectiles.splice(i, 1);
    }
  }
}

// 當瀏覽器視窗大小改變時，自動調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 重設地面位置和角色位置
  groundY = height / 2;
  // 如果角色不在跳躍中，將其放回地面
  newCharY = groundY;
  if (!isJumping) {
    charY = groundY;
  }
}
