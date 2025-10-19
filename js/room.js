// ============================================
// 방 전환 관리 (room.js)
// ============================================

// 방 표시
function showRoom(roomNum, showStory = true) {
    for (let i = 1; i <= 3; i++) {
        const room = document.getElementById(`room${i}`);
        room.style.display = 'none';
        room.classList.remove('active', 'exit-left');
    }
   
    const currentRoomElement = document.getElementById(`room${roomNum}`);
    currentRoomElement.style.display = 'block';
   
    setTimeout(() => {
        currentRoomElement.classList.add('active');
        if (showStory) {
            showStoryModal(roomNum);
        } else {
            startRoomTimer();
        }
    }, 100);
}

// 다음 방으로 이동
function nextRoom() {
    const nextRoomNum = currentRoom + 1;
    stopRoomTimer();

    const videoKey = `room${currentRoom}`;
    showTransitionWithVideo(videoKey, () => {
        document.getElementById(`room${currentRoom}`).classList.add('exit-left');
       
        setTimeout(() => {
            currentRoom = nextRoomNum;
            localStorage.setItem('currentRoom', currentRoom);
            showRoom(currentRoom);
            document.getElementById('nextRoomBtn').style.display = 'none';
            updateUI();
        }, 400);
    });
}

// 방 완료 확인
function checkRoomCompletion() {
    const roomQuizzes = getRoomQuizzes(currentRoom);
    const completed = roomQuizzes.every(id => completedQuizzes.includes(id));
   
    if (completed) {
        if (currentRoom < 3) {
            document.getElementById('nextRoomBtn').style.display = 'block';
        }
    } else {
        document.getElementById('nextRoomBtn').style.display = 'none';
    }
}

// 스토리 모달 표시
function showStoryModal(roomNum) {
    const story = roomStories[roomNum];
    if (story) {
        document.getElementById('storyTitle').textContent = story.title;
        document.getElementById('storyContent').innerHTML = story.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        document.getElementById('storyModal').style.display = 'flex';
    }
}

// 스토리 모달 닫기
function closeStoryModal() {
    document.getElementById('storyModal').style.display = 'none';
    startRoomTimer();
}

// 엔딩 시퀀스 시작
function startEndingSequence() {
    stopRoomTimer();
    
    // 게임 화면을 먼저 투명하게 (3번방이 다시 안 보이게)
    document.getElementById('gameScreen').style.opacity = '0';
    
    // room3 전환 비디오 재생
    showTransitionWithVideo('room3', () => {
        // 비디오 끝난 후 엔딩 화면으로 바로 전환
        document.getElementById('gameScreen').style.display = 'none';
        
        const endingScreen = document.getElementById('endingScreen');
        endingScreen.style.display = 'flex';
        endingScreen.style.opacity = '1';
        endingScreen.style.transform = 'scale(1.5)';
        
        setTimeout(() => {
            endingScreen.classList.add('active');
            endingScreen.style.transition = 'transform 3s ease-out';
            endingScreen.style.transform = 'scale(1)';
            
            playBackgroundMusic();
            createCelebrationEffect();
            localStorage.setItem('gameCompleted', 'true');
        }, 100);
    });
}
