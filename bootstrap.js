import {config} from './config.js';
if(config.releaseReady===true){
 await import('./app.js');
}else{
 // The hosting address can go live without opening unverified backend workflows.
 document.querySelector('#app').innerHTML='<main class="launch-page"><div class="brand"><b>P</b><div>PMT<small>Company workspace</small></div></div><div class="eyebrow">PROJECTS / BUILDS / QUALITY</div><h1>Workspace setup<br>in progress.</h1><p>Your team’s project, APK and QA workspace is being configured.</p><p class="muted">Team sign-in will open after setup and security verification are complete.</p><button id="launch-refresh" class="primary">Refresh status</button><footer>PMT · Internal team workspace</footer></main>';
 document.querySelector('#launch-refresh').addEventListener('click',()=>location.reload());
}
