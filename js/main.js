// 잘되면 밥한끼 Web v0 JavaScript

// 1) 꽃잎 애니메이션
const petalLayer = document.getElementById("petalLayer");
function createPetal(){
  if(!petalLayer) return;
  const petal = document.createElement("div");
  petal.classList.add("petal");
  petal.style.left = `${Math.random()*100}%`;
  petal.style.animationDuration = `${7 + Math.random()*7}s`;
  petal.style.opacity = `${0.35 + Math.random()*0.5}`;
  petalLayer.appendChild(petal);
  setTimeout(()=>petal.remove(),15000);
}
for(let i=0;i<12;i+=1){ setTimeout(createPetal,i*350); }
setInterval(createPetal,850);

// 2) 프로필 사진 미리보기
const profilePhotoInput = document.getElementById("profilePhoto");
const photoPreview = document.getElementById("photoPreview");
if(profilePhotoInput && photoPreview){
  photoPreview.addEventListener("click",()=>profilePhotoInput.click());
  profilePhotoInput.addEventListener("change",()=>{
    const file = profilePhotoInput.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.addEventListener("load",()=>{
      photoPreview.innerHTML = `<img src="${reader.result}" alt="선택한 프로필 사진 미리보기" />`;
    });
    reader.readAsDataURL(file);
  });
}

// 3) 기획용 신청서 제출
const applicationForm = document.getElementById("applicationForm");
const prototypeMessage = document.getElementById("prototypeMessage");
if(applicationForm){
  applicationForm.addEventListener("submit",(event)=>{
    event.preventDefault();
    if(prototypeMessage){
      prototypeMessage.hidden = false;
      prototypeMessage.scrollIntoView({behavior:"smooth",block:"center"});
    }
    console.log("기획용 폼 제출 완료");
  });
}
