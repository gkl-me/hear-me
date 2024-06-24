
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
            title: 'Are You want to delete',
            text: "Are you sure you want to delete this?",
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

                // console.log(user)

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
                        // window.location.reload()
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




//add to wishlist fetch 

async function addToWishlist(productId,user,wishlistIcon){
    try {

        if(user){

            const res = await fetch('/user/addToWishlist',{
                method: 'POST',
                headers: {
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({productId})

            })

            if(res.ok){
                const data = await res.json()
                if(data.inWishlist){
                    // wishlist heart to red
                    wishlistIcon.classList.remove('bi-heart')
                    wishlistIcon.classList.add('bi-heart-fill')
                    showToast('Product added to wishlist.');
                    // wishlistIcon.style.color= 'red';
                }else{
                    wishlistIcon.classList.remove('bi-heart-fill')
                    wishlistIcon.classList.add('bi-heart')
                    // wishlistIcon.style.color = 'black'
                }
                
                if(window.location.pathname === "/user/wishlist"){
                    await updateWishlist();
                }

            }else{
                showError(`failed to update wishlist`)
            }

        }else{
            window.location.href = '/user/login'
        }
        
    } catch (error) {
        console.log(`error in add to wishlist fetch ${error}`)
        showError('failed to add to wishlist')
    }
}


function showToast(message) {
    const toastElement = document.getElementById('wishlist-toast');
    const toastBody = toastElement.querySelector('.toast-body');
    toastBody.textContent = message;

    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}


// update wishlist function 

