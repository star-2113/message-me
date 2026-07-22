let currentUser = null;
let currentChat = "";


// LOAD USER
async function loadUser() {

    const { data } = await supabaseClient.auth.getUser();

    if (!data.user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = data.user;

    loadFriends();
    listenForMessages();
}

loadUser();


// ENTER KEY SEND
function enterSend(event){

    if(event.key === "Enter"){
        sendMessage();
    }

}


// SEND MESSAGE
async function sendMessage(){

    if(currentChat === ""){
        alert("Choose a friend first!");
        return;
    }

    let input = document.getElementById("messageInput");
    let text = input.value;


    if(text.trim() === ""){
        return;
    }


    const { error } = await supabaseClient
        .from("messages")
        .insert({
            sender: currentUser.id,
            receiver: currentChat,
            message: text
        });


    if(error){
        alert(error.message);
        return;
    }


    input.value = "";

    loadMessages();

}



// OPEN CHAT
function openChat(id, name){

    currentChat = id;

    document.getElementById("chatName").innerHTML =
        "Chat with " + name;

    loadMessages();

}



// LOAD MESSAGES
async function loadMessages(){

    if(currentChat === ""){
        return;
    }


    const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .or(
            `and(sender.eq.${currentUser.id},receiver.eq.${currentChat}),and(sender.eq.${currentChat},receiver.eq.${currentUser.id})`
        )
        .order("created_at", {ascending:true});


    if(error){
        console.log(error);
        return;
    }


    let box = document.getElementById("messages");

    box.innerHTML = "";


    for(const msg of data){


        let message = document.createElement("div");


        message.className =
            msg.sender === currentUser.id
            ? "message my-message"
            : "message";


        let senderName = "Friend";


        if(msg.sender === currentUser.id){

            senderName = "You";

        } else {


            const {data: profile} = await supabaseClient
                .from("profiles")
                .select("display_name")
                .eq("id", msg.sender)
                .single();


            if(profile){
                senderName = profile.display_name;
            }

        }



        let time = new Date(msg.created_at)
            .toLocaleTimeString([], {
                hour:"2-digit",
                minute:"2-digit"
            });



        message.innerHTML = `

            <div class="message-name">
                ${senderName}
            </div>

            <div>
                ${msg.message}
            </div>

            <small>
                ${time}
            </small>

        `;


        box.appendChild(message);

    }


    box.scrollTop = box.scrollHeight;

}



// SEARCH USERS TO ADD
async function searchUsers(){

    let search = document
        .getElementById("userSearch")
        .value
        .trim();


    if(search === ""){
        return;
    }



    const {data, error} = await supabaseClient
        .from("profiles")
        .select("*")
        .ilike("username", `%${search}%`)
        .neq("id", currentUser.id);



    if(error){
        console.log(error);
        return;
    }



    let results = document.getElementById("searchResults");

    results.innerHTML = "";



    data.forEach(function(user){


        let div = document.createElement("div");

        div.className = "friend";


        div.innerHTML = `

            <span>
                ${user.display_name}
            </span>

            <button>
                Add Friend
            </button>

        `;



        div.querySelector("button").onclick = function(){

            sendFriendRequest(user.id);

        };


        results.appendChild(div);


    });

}



// SEND FRIEND REQUEST
async function sendFriendRequest(receiverID){


    const {error} = await supabaseClient
        .from("friend_requests")
        .insert({

            sender: currentUser.id,
            receiver: receiverID,
            status:"pending"

        });



    if(error){

        alert(error.message);
        return;

    }


    alert("Friend request sent 💙");

}



// LOAD FRIENDS
async function loadFriends(){


    const {data,error} = await supabaseClient
        .from("profiles")
        .select("*")
        .neq("id", currentUser.id);



    if(error){
        console.log(error);
        return;
    }



    let list = document.getElementById("friendsList");

    list.innerHTML = "";



    data.forEach(function(friend){


        let div = document.createElement("div");

        div.className = "friend";


        div.innerHTML = `

            <img
            src="https://api.dicebear.com/9.x/initials/svg?seed=${friend.display_name}"
            class="avatar">

            <span>
                ${friend.display_name}
            </span>

        `;



        div.onclick = function(){

            openChat(
                friend.id,
                friend.display_name
            );

        };


        list.appendChild(div);

    });

}



// SEARCH FRIENDS LIST
function searchFriends(){

    let search =
        document.getElementById("searchFriends")
        .value
        .toLowerCase();



    let friends =
        document.getElementsByClassName("friend");



    for(let i=0;i<friends.length;i++){


        if(
            friends[i].innerText
            .toLowerCase()
            .includes(search)
        ){

            friends[i].style.display="flex";

        }
        else{

            friends[i].style.display="none";

        }

    }

}



// REALTIME MESSAGES
function listenForMessages(){

    supabaseClient
    .channel("messages")
    .on(
        "postgres_changes",
        {
            event:"INSERT",
            schema:"public",
            table:"messages"
        },

        function(payload){

            let msg = payload.new;


            if(
                (msg.sender === currentUser.id &&
                 msg.receiver === currentChat)

                ||

                (msg.sender === currentChat &&
                 msg.receiver === currentUser.id)

            ){

                loadMessages();

            }

        }

    )
    .subscribe();

}



// DARK/LIGHT MODE
function mode(){

    document.body.classList.toggle("light");

}