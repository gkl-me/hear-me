
//to display alert for only a time period

const alertDuration=4000;

setTimeout(() => {
    const alerContainer = document.getElementsByClassName('alert-container')[0]
    
    if(alerContainer){
        alerContainer.style.display ='none'; 
    }
    
}, alertDuration);


//sweet alert for delete confirmation
const alertDelete = document.querySelectorAll('.sweet-alert-delete')

alertDelete.forEach((ele) => {
    ele.addEventListener('click', (event) =>{
        event.preventDefault();

        Swal.fire({
            title: 'Deactivate the category',
            text: "Are you sure you want to deactivate the category?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10051F',
            cancelButtonColor: '#D5D2FF',
            confirmButtonText: 'Confirm'
        }).then((res)=>{
            if(res.isConfirmed){
                window.location.href = event.target.closest('a').href;
            }
        })
    })

})




//edit collection modal view foreach
const editCollection = document.querySelectorAll('#edit-collection-modal')

editCollection.forEach((ele)=>{
    ele.addEventListener('click',function () {
        const name =  this.getAttribute('data-name');
        const id = this.getAttribute('data-id');
        document.getElementById('editCollectionName').value= name;
        document.getElementById('editCollectionId').value = id;
    })
})




const imageUpload = document.getElementById('image-upload')
const imageUploadPreview = document.getElementById('image-upload-preview')
let cropper;
let currentImage;
const cropperModalElement = document.getElementById('cropperModal');
const cropperModal = new bootstrap.Modal(document.getElementById('cropperModal'), {});


imageUpload.addEventListener('change', () => {
    imageUploadPreview.innerHTML = "";

    if(imageUpload.files.length!=3){
        Swal.fire({
            icon: 'error',
            title: 'Oops',
            text: 'Select three Images'
        })

        imageUpload.value = ''

    }else{

        for(let i=0; i<imageUpload.files.length;i++){
            let reader = new FileReader();
            let figure = document.createElement('div')
            figure.classList.add('image-preview-box')
    
            reader.onload = () => {
    
                let img = document.createElement('img')
                img.classList.add("preview-img");
                img.setAttribute("src", reader.result);
                figure.appendChild(img);
    
                // Create delete button with class delete-button
                let deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete";
                deleteButton.classList.add('btn',"submit-btn",'delete-button');
                deleteButton.addEventListener("click", () => {
                // Remove the parent div (figure) when the delete button is clicked
                    figure.remove();
                    imageUpload.value= '';
                });
    
    
                figure.appendChild(deleteButton)
                imageUploadPreview.appendChild(figure)
    
                img.addEventListener("click", () => {
                    currentImage = img;
                    document.getElementById('image-to-crop').src = reader.result;
                    cropperModal.show();
                    cropperModalElement.addEventListener('shown.bs.modal', () => {
                        if (cropper) cropper.destroy();
                        const imageToCrop = document.getElementById('image-to-crop');
                        cropper = new Cropper(imageToCrop, {
                            aspectRatio: 0,
                            viewMode: 0,
                            autoCropArea: 0,
                            responsive: true,
                            background: false,
                        });
                    }, { once: true });
                });
                };
    
                reader.readAsDataURL(imageUpload.files[i]);
                }
    }

            });

 // Crop button event listener
document.getElementById('crop-button').addEventListener('click', () => {
const canvas = cropper.getCroppedCanvas();
currentImage.src = canvas.toDataURL();
cropperModal.hide();
cropper.destroy();
});





// cart script addtoProduct

function showError(msg){
    Swal.fire({
        icon:'error',
        title: 'Oops',
        text: msg,
    })
}

async function addToCart(productId,user){


        try {

            if(user){

                console.log(user)

                const res = await fetch('/user/cart/add',{
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({productId, quantity: 1}),
                })
        
                if(res.ok){
        
                    Swal.fire({
                        icon: "success",
                        title: "Product added to cart",
                        showConfirmButton: false,
                        timer: 700,
                    }).then(() => {
                        window.location.reload()
                    })
        
                    const cart = await res.json();
                       
                }else{
        
                    const error = await res.text();
        
                    showError(error)
        
                }
            }else{
                window.location.href = '/user/login'

            }

            
            
        } catch (error) {
    
                console.log(`error at add to cart fetch ${error}`)
    
        }

}

