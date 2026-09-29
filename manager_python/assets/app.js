let state;
const $=selector=>document.querySelector(selector);
const note=text=>$('#notice').textContent=text;

async function request(url,options){
	const response=await fetch(url,options);
	const body=response.status===204?null:await response.json();
	if(!response.ok)throw Error(body?.error||'Nie udało się wykonać operacji.');
	return body;
}

function render(){
	const holder=$('#photos');
	holder.replaceChildren();
	$('#count').textContent=`${state.photos.length} ${state.photos.length===1?'zdjęcie':'zdjęć'} w galerii`;
	state.photos.forEach(photo=>{
		const item=document.createElement('article');
		item.className='photo';
		item.dataset.name=photo.name;
		const image=document.createElement('img');
		image.src=photo.url;
		image.alt='';
		image.loading='lazy';
		const title=document.createElement('p');
		title.className='photo-name';
		title.textContent=photo.name;
		const actions=document.createElement('div');
		actions.className='photo-actions';
		const rename=document.createElement('button');
		rename.type='button';
		rename.className='rename';
		rename.textContent='✎';
		rename.ariaLabel=`Zmień nazwę: ${photo.name}`;
		rename.onclick=()=>renamePhoto(photo.name).catch(error=>note(error.message));
		actions.append(rename);
		const remove=document.createElement('button');
		remove.type='button';
		remove.className='delete';
		remove.textContent='×';
		remove.ariaLabel=`Usuń ${photo.name}`;
		remove.onclick=()=>deletePhoto(photo.name).catch(error=>note(error.message));
		item.append(image,title,actions,remove);
		holder.append(item);
	});
}

async function load(){state=await request('/api/state');render()}
async function deletePhoto(name){
	if(!confirm(`Przenieść „${name}” do kosza?`))return;
	await request(`/api/photo/${encodeURIComponent(name)}`,{method:'DELETE'});
	await load();
}
async function renamePhoto(name){
	const extension=name.slice(name.lastIndexOf('.'));
	const current=name.slice(0,-extension.length);
	const requested=prompt('Nowa nazwa zdjęcia (bez rozszerzenia):',current);
	if(requested===null||!requested.trim()||requested.trim()===current)return;
	const result=await request(`/api/photo/${encodeURIComponent(name)}`,{
		method:'PATCH',
		headers:{'Content-Type':'application/json'},
		body:JSON.stringify({name:requested.trim()})
	});
	note(`Zmieniono nazwę na ${result.name}.`);
	await load();
}

async function upload(files){
	if(!files.length)return;
	note('Przesyłanie i przygotowywanie miniatur…');
	try{
		const form=new FormData();
		[...files].forEach(file=>form.append('files',file,file.name));
		const result=await request('/api/upload',{method:'POST',body:form});
		note(`Dodano ${result.added.length} zdjęć${result.rejected.length?`; pominięto ${result.rejected.join(', ')}`:''}.`);
		await load();
	}catch(error){note(error.message)}finally{$('#files').value=''}
}

const zone=$('#dropzone');
['dragenter','dragover'].forEach(type=>zone.addEventListener(type,event=>{event.preventDefault();zone.classList.add('drag')}));
['dragleave','drop'].forEach(type=>zone.addEventListener(type,event=>{event.preventDefault();zone.classList.remove('drag')}));
zone.ondrop=event=>upload(event.dataTransfer.files);
$('#files').onchange=event=>upload(event.target.files);
window.addEventListener('pagehide',()=>navigator.sendBeacon('/api/shutdown'));
load().catch(error=>note(error.message));
