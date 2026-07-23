let currentUser = null;
let currentChat = "";


// =========================
// LOAD USER
// =========================

async function loadUser() {

    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = data.user;

    loadFriends();
    listenForMessages();

}


// =========================
// START APP
// =========================

loadUser();



// =========================
// ENTER KEY SEND
// =========================

function enterSend(event) {

    if (event.key === "Enter") {
        sendMessage();
    }

}



// =========================
// SEND MESSAGE
// =========================

async function sendMessage() {


    if (currentChat === "") {

        alert("Choose a friend first 💙");
        return;

    }


    const input = document.getElementById("messageInput");

    const text = input.value.trim();


    if (text === "") {
        return;
    }



    const { error } = await supabaseClient
        .from("messages")
        .insert({

            sender: currentUser.id,
            receiver: currentChat,
            message: text

        });



    if (error) {

        alert(error.message);
        return;

    }



    input.value = "";

    loadMessages();


}



// =========================
// OPEN CHAT
// =========================

function openChat(id, name) {


    currentChat = id;


    document.getElementById("chatName").innerHTML =
        "Chat with " + name;



    loadMessages();


}



// =========================
// LOAD MESSAGES
// =========================

async function loadMessages() {


    if (currentChat === "") {
        return;
    }



    const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .or(
            `and(sender.eq.${currentUser.id},receiver.eq.${currentChat}),and(sender.eq.${currentChat},receiver.eq.${currentUser.id})`
        )
        .order("created_at", {
            ascending: true
        });



    if (error) {

        console.log(error);
        return;

    }



    const box = document.getElementById("messages");

    box.innerHTML = "";



    for (const msg of data) {


        const message = document.createElement("div");



        if (msg.sender === currentUser.id) {

            message.className =
                "message my-message";

        } 
        
        else {

            message.className =
                "message";

        }



        let senderName = "Friend";



        if (msg.sender === currentUser.id) {

            senderName = "You";

        }

        else {


            const { data: profile } = await supabaseClient
                .from("profiles")
                .select("display_name")
                .eq("id", msg.sender)
                .single();



            if (profile) {

                senderName =
                    profile.display_name;

            }

        }



        const time =
            new Date(msg.created_at)
            .toLocaleTimeString([], {

                hour: "2-digit",
                minute: "2-digit"

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




// =========================
// LOAD FRIENDS
// =========================

async function loadFriends() {


    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .neq("id", currentUser.id);



    if (error) {

        console.log(error);
        return;

    }



    const list =
        document.getElementById("friendsList");



    list.innerHTML = "";



    data.forEach(friend => {



        const div =
            document.createElement("div");



        div.className =
            "friend";



        div.innerHTML = `

            <img
            src="https://api.dicebear.com/9.x/initials/svg?seed=${friend.display_name}"
            class="avatar">

            <span>
                ${friend.display_name}
            </span>

        `;



        div.onclick = function() {

            openChat(
                friend.id,
                friend.display_name
            );

        };



        list.appendChild(div);



    });


}




// =========================
// SEARCH FRIENDS
// =========================

function searchFriends() {


    const search =
        document.getElementById("searchFriends")
        .value
        .toLowerCase();



    const friends =
        document.getElementsByClassName("friend");



    for (let friend of friends) {


        if (
            friend.innerText
            .toLowerCase()
            .includes(search)
        ) {

            friend.style.display = "flex";

        }

        else {

            friend.style.display = "none";

        }

    }


}




// =========================
// DARK MODE
// =========================

function mode() {

    document.body.classList.toggle("light");

}



// =========================
// REAL TIME MESSAGES
// =========================

function listenForMessages() {


    supabaseClient
    .channel("messages")
    .on(

        "postgres_changes",

        {

            event: "INSERT",
            schema: "public",
            table: "messages"

        },


        payload => {


            const msg =
                payload.new;



            if (

                (msg.sender === currentUser.id &&
                msg.receiver === currentChat)

                ||

                (msg.sender === currentChat &&
                msg.receiver === currentUser.id)

            ) {

                loadMessages();

            }


        }

    )

    .subscribe();


}