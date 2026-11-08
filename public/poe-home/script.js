(()=>{
  'use strict';
  let stillMounted=true;
  let disconnectVideo=()=>{};
  window.FIXLGS_POE2_HOME_DESTROY=()=>{stillMounted=false;disconnectVideo();};
  const menuToggle=document.querySelector('#menu-toggle');
  const navigation=document.querySelector('#primary-nav');
  menuToggle?.addEventListener('click',()=>{
    const open=menuToggle.getAttribute('aria-expanded')==='true';
    menuToggle.setAttribute('aria-expanded',String(!open));
    navigation.classList.toggle('open',!open);
  });
  navigation?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{navigation.classList.remove('open');menuToggle?.setAttribute('aria-expanded','false')}));
  const realms={
    character:{eyebrow:'캐릭터 빌드 분석',title:'링크 하나로 캐릭터 분석',description:'poe.ninja 캐릭터 링크만 입력하세요. 복잡한 빌드 설정 없이 캐릭터의 스킬, 장비, DPS와 능력치를 확인할 수 있습니다.',points:['캐릭터 링크 입력','스킬·장비 정보 불러오기','현재 DPS와 능력치 확인']},
    compare:{eyebrow:'아이템 교체 DPS 비교',title:'구매하기 전에 DPS부터 비교',description:'거래소에서 찾은 아이템을 불러와 기존 장비와 비교하세요. 장비를 교체했을 때 DPS와 능력치가 얼마나 달라지는지 확인할 수 있습니다.',points:['거래소 아이템 불러오기','장비 교체 전후 DPS 계산','능력치 상승·하락 비교']}
  };
  const realmTabs=[...document.querySelectorAll('[data-realm]')];
  realmTabs.forEach(tab=>tab.addEventListener('click',()=>{
    const d=realms[tab.dataset.realm];if(!d)return;
    realmTabs.forEach(t=>{t.classList.toggle('active',t===tab);t.setAttribute('aria-selected',String(t===tab))});
    document.querySelector('#realm-eyebrow').textContent=d.eyebrow;
    document.querySelector('#realm-title').textContent=d.title;
    document.querySelector('#realm-description').textContent=d.description;
    document.querySelector('#realm-points').replaceChildren(...d.points.map(s=>{const el=document.createElement('li');el.textContent=s;return el}));
  }));
  // Each representative item icon is actual PoE2 art, linked by its extracted art path.
  // Item names/rarity are illustrative: equipment rarity is not baked into base item art.
  const itemArtBase='https://raw.githubusercontent.com/josh-dastmalchi/exiledata-assets/main/';
  const classes={
    currency:{title:'화폐 필터 설정',description:'POE2 화폐 아이템의 중요도와 표시 방식을 원하는 대로 조정하세요.',icon:'2DItems/Currency/CurrencyRerollRare.webp',fallback:'◉'},
    unique:{title:'고유 아이템 필터',description:'고유 아이템을 구분하고 원하는 장비의 표시 규칙을 설정하세요.',icon:'2DItems/Armours/Helmets/Uniques/RadiantGrief.webp',fallback:'♜'},
    rare:{title:'레어·매직 장비 필터',description:'레어·매직 장비의 종류와 등급에 맞게 필터를 설정하세요.',icon:'2DItems/Armours/Helmets/Basetypes/HelmetDexInt03.webp',fallback:'✥'},
    normal:{title:'일반 장비 필터',description:'필요한 베이스 아이템을 선택해 표시 여부를 설정하세요.',icon:'2DItems/Weapons/OneHandWeapons/OneHandSwords/Basetypes/1HSword03.webp',fallback:'⚔'},
    gem:{title:'젬 필터 설정',description:'젬 종류별로 필요한 아이템을 구분하고 표시를 설정하세요.',icon:'2DItems/Gems/UncutSkillGem.webp',fallback:'◆'},
    jewel:{title:'주얼 필터 설정',description:'주얼의 종류에 따라 표시 규칙을 설정하세요.',icon:'2DItems/Jewels/RubyJewel.webp',fallback:'◇'},
    flask:{title:'플라스크 필터',description:'플라스크 종류별 필터 설정을 조정하세요.',icon:'2DItems/Flasks/Basetypes/FlaskLife01.webp',fallback:'♧'},
    charm:{title:'호신부 필터 설정',description:'호신부 종류에 따른 표시 방식을 설정하세요.',icon:'2DItems/Charms/Basetypes/SapphireCharm.webp',fallback:'✦'}
  };
  const classTabs=[...document.querySelectorAll('[data-class]')];
  const itemImage=document.querySelector('#class-item-image');
  const itemSymbol=document.querySelector('.class-item-symbol');
  const itemFallback=document.querySelector('#class-item-fallback');
  const showItem=(key)=>{
    const d=classes[key];if(!d)return;
    document.querySelector('#class-title').textContent=d.title;
    document.querySelector('#class-description').textContent=d.description;
    itemFallback.textContent=d.fallback;
    itemSymbol.classList.remove('has-item-art');
    // In case a cached image finishes after switching, only display the currently chosen art.
    itemImage.removeAttribute('src');
    itemImage.src=itemArtBase+d.icon;
  };
  itemImage?.addEventListener('load',()=>itemSymbol.classList.add('has-item-art'));
  itemImage?.addEventListener('error',()=>itemSymbol.classList.remove('has-item-art'));
  classTabs.forEach(tab=>tab.addEventListener('click',()=>{
    if(!classes[tab.dataset.class])return;
    classTabs.forEach(t=>{t.classList.toggle('active',t===tab);t.setAttribute('aria-selected',String(t===tab))});
    showItem(tab.dataset.class);
  }));
  showItem('currency');
  // V256 공식 채널 영상 목록: 스냅샷 우선, HTML 초기 목록은 폴백.
  // YouTube는 HTTP Referer를 요구한다. file://로 연 페이지에서는 실영상 임베드를 시도하지 않는다.
  const videoCards=[...document.querySelectorAll('#poe2-videos .video-edition')];
  const videoSection=document.querySelector('#editions');
  const videoStatus=document.querySelector('#video-status');
  const isHttpPage=/^https?:$/.test(location.protocol);
  const setVideoStatus=message=>{if(videoStatus)videoStatus.textContent=message};
  const snapshot=Array.isArray(window.FIXLGS_POE2_VIDEOS)?window.FIXLGS_POE2_VIDEOS.slice(0,3):[];
  snapshot.forEach((video,i)=>{
    if(videoCards[i]&&video&&typeof video.id==='string'&&/^[A-Za-z0-9_-]{11}$/.test(video.id)){
      videoCards[i].dataset.youtubeId=video.id;
      if(typeof video.title==='string')videoCards[i].querySelector('.edition-video')?.setAttribute('aria-label',video.title+' 영상 영역');
    }
  });
  const videoIds=videoCards.map(card=>(card.dataset.youtubeId||'').trim());
  const videoIdsValid=videoCards.length===3&&videoIds.every(id=>/^[A-Za-z0-9_-]{11}$/.test(id));
  if(videoSection&&videoIdsValid){
    let activeVideo=-1;
    let currentPlayer=null;
    let playerReady=false;
    let apiReady=false;
    let apiLoading=false;
    let videoVisible=false;
    let selectionToken=0;
    let playbackStarted=false;
    const soundButton=i=>videoCards[i].querySelector('.video-sound');
    const actionButton=i=>videoCards[i].querySelector('.video-action');
    const labelSound=(i,muted)=>{
      const button=soundButton(i);
      button.textContent=muted?'소리 켜기':'소리 끄기';
      button.setAttribute('aria-label',muted?'소리 켜기':'소리 끄기');
    };
    const restorePreview=card=>{
      const stage=card.querySelector('.edition-video');
      stage.classList.remove('is-playing');
      stage.querySelector('.video-player')?.remove();
      soundButton(videoCards.indexOf(card)).hidden=true;
      labelSound(videoCards.indexOf(card),true);
    };
    const errorMessage=code=>{
      if(code===153)return '오류 153: YouTube가 임베드 식별(Referer)을 받지 못했습니다. HTTP(S) 미리보기로 열어 보세요.';
      if(code===100)return '오류 100: 영상이 삭제됐거나 비공개 상태입니다.';
      if(code===101||code===150)return `오류 ${code}: 영상 소유자가 외부 재생을 허용하지 않습니다.`;
      return `YouTube 재생 오류 ${code}: 아래 영상 재생 버튼으로 다시 시도할 수 있습니다.`;
    };
    const playAt=index=>{
      if(!stillMounted)return;
      if(!apiReady||!window.YT||typeof window.YT.Player!=='function')return;
      const token=++selectionToken;
      if(currentPlayer){try{currentPlayer.destroy()}catch(_e){}currentPlayer=null}
      videoCards.forEach(restorePreview);
      activeVideo=index;
      playerReady=false;
      playbackStarted=true;
      const card=videoCards[index];
      const stage=card.querySelector('.edition-video');
      const slot=document.createElement('div');
      slot.className='video-player';
      stage.appendChild(slot);
      card.dataset.playState='loading';
      stage.querySelector('.video-placeholder').textContent='공식 영상';
      actionButton(index).textContent='영상 재생';
      setVideoStatus(`${index+1}번 영상 로딩 중 · 음소거 순차 재생`);
      const options={
        videoId:videoIds[index],width:'100%',height:'100%',
        playerVars:{autoplay:1,playsinline:1,controls:1,rel:0,enablejsapi:1,mute:1,origin:location.origin},
        events:{
          onReady(event){
            if(!stillMounted)return;
            if(token!==selectionToken)return;
            currentPlayer=event.target;
            playerReady=true;
            event.target.mute();
            soundButton(index).hidden=false;
            labelSound(index,true);
            // '준비'는 재생 성공이 아니다. 실제 PLAYING 이벤트를 받을 때만 정지 포스터를 숨긴다.
            if(videoVisible)event.target.playVideo();
          },
          onStateChange(event){
            if(!stillMounted)return;
            if(token!==selectionToken)return;
            if(event.data===window.YT.PlayerState.PLAYING){
              stage.classList.add('is-playing');
              card.dataset.playState='playing';
              setVideoStatus(`${index+1}번 영상 재생 중 · 다음 영상은 자동으로 음소거됩니다.`);
            }else if(event.data===window.YT.PlayerState.ENDED){
              playAt((index+1)%videoCards.length);
            }
          },
          onAutoplayBlocked(){
            if(token!==selectionToken)return;
            card.dataset.playState='blocked';
            stage.classList.remove('is-playing');
            actionButton(index).textContent='재생하기';
            setVideoStatus('브라우저가 자동재생을 제한했습니다. 영상 재생 버튼을 누르면 수동으로 시작할 수 있습니다.');
          },
          onError(event){
            if(token!==selectionToken)return;
            card.dataset.playState='error';
            const message=errorMessage(event.data);
            // 플레이어 오류를 숨기지 말고 원인과 재시도 방법을 남긴다.
            if(currentPlayer){try{currentPlayer.destroy()}catch(_e){}currentPlayer=null}
            playerReady=false;
            restorePreview(card);
            stage.querySelector('.video-placeholder').textContent=`오류 ${event.data}`;
            actionButton(index).textContent='다시 재생';
            setVideoStatus(`영상 ${index+1}: ${message}`);
          }
        }
      };
      try{
        currentPlayer=new window.YT.Player(slot,options);
      }catch(error){
        restorePreview(card);
        card.dataset.playState='error';
        setVideoStatus(`플레이어 시작에 실패했습니다: ${error?.message||'알 수 없는 오류'}`);
      }
    };
    const loadApi=()=>{
      if(apiReady){if(!playbackStarted)playAt(0);return}
      if(apiLoading)return;
      apiLoading=true;
      if(window.YT&&typeof window.YT.Player==='function'){
        apiReady=true;playAt(0);return;
      }
      const previousReady=window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady=()=>{
        if(!stillMounted)return;
        if(typeof previousReady==='function')previousReady();
        apiReady=true;apiLoading=false;playAt(0);
      };
      const script=document.createElement('script');
      script.src='https://www.youtube.com/iframe_api';
      script.async=true;
      script.onerror=()=>{
        apiLoading=false;
        script.remove();
        setVideoStatus('YouTube 연결 실패: 네트워크/차단 설정을 확인한 후 영상 재생 버튼으로 다시 시도하세요.');
      };
      document.head.appendChild(script);
    };
    videoCards.forEach((card,index)=>{
      const action=actionButton(index);
      action.disabled=false;
      if(!isHttpPage){
        // 로컬 직접 열기(file://)로는 YouTube가 Referer를 받지 못할 수 있으므로
        // 플레이어 생성 대신 재생 불가 원인과 실행 방법을 분명하게 표시한다.
        card.dataset.playState='local-file';
        action.textContent='YouTube에서 보기';
        action.addEventListener('click',()=>window.open(`https://www.youtube.com/watch?v=${videoIds[index]}`,'_blank','noopener,noreferrer'));
        return;
      }
      action.textContent='영상 재생';
      action.addEventListener('click',()=>{
        if(apiReady){
          if(activeVideo===index&&currentPlayer&&playerReady){
            currentPlayer.mute();labelSound(index,true);
            currentPlayer.playVideo();
          }else playAt(index);
        }else{
          loadApi();
          setVideoStatus('YouTube 플레이어를 불러오는 중입니다.');
        }
      });
      soundButton(index).addEventListener('click',()=>{
        if(index!==activeVideo||!currentPlayer||!playerReady)return;
        if(currentPlayer.isMuted())currentPlayer.unMute();else currentPlayer.mute();
        labelSound(index,currentPlayer.isMuted());
      });
    });
    disconnectVideo=()=>{
      selectionToken++;
      if(currentPlayer){try{currentPlayer.destroy()}catch(_e){}currentPlayer=null}
    };
    if(!isHttpPage){
      setVideoStatus('로컬 HTML을 직접 열면(file://) YouTube 자동재생이 차단될 수 있습니다. 이 폴더의 「영상미리보기.cmd」로 홈페이지를 열어 확인하세요.');
    }else if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{
        const visible=entries.some(entry=>entry.isIntersecting);
        if(visible&&!videoVisible){
          videoVisible=true;
          if(!playbackStarted)loadApi();
          else if(currentPlayer&&playerReady){currentPlayer.mute();labelSound(activeVideo,true);currentPlayer.playVideo()}
        }else if(!visible&&videoVisible){
          videoVisible=false;
          if(currentPlayer&&playerReady){currentPlayer.mute();labelSound(activeVideo,true);currentPlayer.pauseVideo()}
        }
      },{threshold:0.12});
      observer.observe(videoSection);
      const previousDisconnect=disconnectVideo;
      disconnectVideo=()=>{observer.disconnect();previousDisconnect();};
    }else{
      videoVisible=true;loadApi();
    }
  }
  // V015: 실영상 재생 성공은 실제 YouTube 서버와 HTTP(S) Origin을 사용하는 브라우저에서 별도 확인해야 한다.
})();
