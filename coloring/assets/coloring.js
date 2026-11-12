
(function(){
  var sv=document.querySelector('.sheet svg');if(!sv)return;
  var cur=document.querySelector('.pal button[aria-pressed=true]').getAttribute('data-c'),undo=[];
  document.querySelector('.pal').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;cur=b.getAttribute('data-c');
    document.querySelectorAll('.pal button').forEach(function(x){x.setAttribute('aria-pressed',x===b)})});
  sv.addEventListener('click',function(e){var t=e.target.closest('.f');if(!t)return;undo.push([t,t.style.fill]);t.style.fill=cur});
  document.getElementById('cundo').onclick=function(){var u=undo.pop();if(u)u[0].style.fill=u[1]};
  document.getElementById('cclear').onclick=function(){sv.querySelectorAll('.f').forEach(function(x){x.style.fill=''});undo=[]};
  document.getElementById('pblank').onclick=function(){document.body.classList.add('blank');window.print();setTimeout(function(){document.body.classList.remove('blank')},800)};
  document.getElementById('pmine').onclick=function(){document.body.classList.remove('blank');window.print()};
  var h=document.querySelector('[data-say]');if(h)h.onclick=function(){if(!window.speechSynthesis)return;var u=new SpeechSynthesisUtterance(h.getAttribute('data-say'));u.lang='hi-IN';u.rate=.8;speechSynthesis.cancel();speechSynthesis.speak(u)};
})();
