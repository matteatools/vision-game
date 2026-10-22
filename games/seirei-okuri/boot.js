// Visible retry guidance even if the game bundle or a local library fails.
(function(){
    function fail(){
        if(window.LanternBootReady)return;
        const panel=document.getElementById('startup'),message=document.getElementById('startup-message');
        if(panel)panel.hidden=false;
        if(message)message.textContent='ゲームを よみこめませんでした。「もういちど よみこむ」を おしてください。';
    }
    window.LanternBoot={ready(){window.LanternBootReady=true;clearTimeout(timer);document.getElementById('startup').hidden=true;}};
    window.addEventListener('error',fail,true);
    const timer=setTimeout(fail,10000);
})();
