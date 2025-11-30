# 1. Become Root
sudo -i

# 2. Install GPG (Just in case)
apt-get install gnupg -y

# 3. Get the NEW Kali Key (The Fix)
gpg --keyserver hkps://keyserver.ubuntu.com --recv-key ED65462EC8D5E4C5
gpg --export ED65462EC8D5E4C5 | tee /usr/share/keyrings/kali-archive-keyring.gpg > /dev/null

# 4. Add the Kali Repository
echo "deb [signed-by=/usr/share/keyrings/kali-archive-keyring.gpg] http://http.kali.org/kali kali-rolling main non-free contrib" > /etc/apt/sources.list.d/kali.list

# 5. Set Priority (Prefer Kali packages)
echo -e "Package: *\nPin: release a=kali-rolling\nPin-Priority: 700" > /etc/apt/preferences.d/kali.pref

# 6. The Big Update (This takes 5-10 mins)
apt update
DEBIAN_FRONTEND=noninteractive apt install -y kali-linux-headless

# 7. Verify
grep VERSION /etc/os-release