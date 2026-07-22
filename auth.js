async function signup() {

    const displayName = document.getElementById("displayName").value;
    const username = document.getElementById("username").value;
    console.log("Name:", displayName);
console.log("Username:", username);
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        console.log(error);
        alert(error.message);
        return;
    }

    const user = data.user;

    const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert({
            id: user.id,
            username: username,
            display_name: displayName
        });

    if (profileError) {
        console.log(profileError);
        alert(profileError.message);
        return;
    }

    alert("Account created successfully!");
    window.location.href = "chat.html";
}


async function login() {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        console.log(error);
        alert(error.message);
        return;
    }

    alert("Login successful!");
    window.location.href = "chat.html";
}