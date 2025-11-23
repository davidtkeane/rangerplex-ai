// pet.js - Cyber Cat Tamagotchi
jQuery(document).ready(function ($) {
    console.log("🐾 pet.js loaded");

    // ==== Feed Pet ====
    window.feedPet = function () {
        console.log("Feeding cat...");
        const eatSound = new Audio(wpnotes_ajax.plugin_url + 'assets/sounds/meow.mp3');
        eatSound.volume = 1;
        eatSound.play().then(() => {
            console.log("🔊 Eat sound played");
        }).catch(err => {
            console.warn("🔇 Eat sound blocked:", err);
        });

        $('#pet-avatar').addClass('feeding');

        $.post(wpnotes_ajax.ajax_url, { action: 'feed_pet' }, function (data) {
            $('#hunger-level').text(data.hunger + '/100');
            $('#xp-value').text(data.xp);
            $('#level-value').text(data.level);
            $('#pet-avatar').removeClass('feeding').addClass('happy');
            setTimeout(() => $('#pet-avatar').removeClass('happy'), 1000);
        });
    };

    // ==== Play with Pet ====
    window.playPet = function () {
        console.log("Playing with cat...");
        const purrSound = new Audio(wpnotes_ajax.plugin_url + 'assets/sounds/purr.mp3');
        purrSound.volume = 1;
        purrSound.play().then(() => {
            console.log("🔊 Purr sound played");
        }).catch(err => {
            console.warn("🔇 Purr sound blocked:", err);
        });

        $('#pet-avatar').addClass('playing');

        $.post(wpnotes_ajax.ajax_url, { action: 'play_pet' }, function (data) {
            $('#happiness-level').text(data.happiness + '/100');
            $('#xp-value').text(data.xp);
            $('#level-value').text(data.level);
            $('#pet-avatar').removeClass('playing').addClass('happy');
            setTimeout(() => $('#pet-avatar').removeClass('happy'), 1000);
        });
    };
});