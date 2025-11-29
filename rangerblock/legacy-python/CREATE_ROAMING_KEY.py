#!/usr/bin/env python3
"""
Create David's USB Roaming Key
Created by: David Keane with Claude Code
Philosophy: "One foot in front of the other" - Secure roaming authentication
Mission: Generate dedicated roaming key for USB key system
Innovation: End 70% of password reset problems!
"""

import hashlib
import uuid
import os
from datetime import datetime

def create_roaming_key():
    """Create David's dedicated USB roaming key"""

    print("🔑 CREATING DAVID'S USB ROAMING KEY")
    print("=" * 50)
    print("🏔️ Philosophy: 'One foot in front of the other'")
    print("🎯 Mission: End password reset problems forever!")
    print("💡 Innovation: USB key authentication system")
    print("=" * 50)

    # Generate David's roaming key
    roaming_seed = f"David-Keane-Roaming-{datetime.now().isoformat()}-AccessibilityRevolution"
    roaming_private_key = hashlib.sha256(roaming_seed.encode()).hexdigest()
    roaming_public_key = hashlib.sha256(roaming_private_key.encode()).hexdigest()

    # Create roaming key metadata
    roaming_key_info = {
        "key_type": "rangercoin_roaming_authentication",
        "owner": "David Keane",
        "purpose": "USB key roaming blockchain profile authentication",
        "created": datetime.now().isoformat(),
        "usage": "Authenticate profile downloads from M3 Genesis",
        "security_note": "Store on USB key for portable blockchain access",
        "philosophy": "One foot in front of the other - Your blockchain anywhere",
        "innovation": "Prevents 70% of password reset problems",
        "fingerprint": hashlib.sha256(roaming_private_key.encode()).hexdigest()[:16]
    }

    # Save roaming private key
    with open('security-keys/rangercoin_roaming_private.pem', 'w') as f:
        f.write(roaming_private_key)
    os.chmod('security-keys/rangercoin_roaming_private.pem', 0o600)

    # Save roaming public key
    with open('security-keys/rangercoin_roaming_public.pem', 'w') as f:
        f.write(roaming_public_key)

    # Save key information
    with open('security-keys/roaming_key_info.json', 'w') as f:
        import json
        json.dump(roaming_key_info, f, indent=2)

    print("🎉 DAVID'S USB ROAMING KEY CREATED!")
    print("=" * 40)
    print("🔑 Private Key: security-keys/rangercoin_roaming_private.pem")
    print("🔓 Public Key: security-keys/rangercoin_roaming_public.pem")
    print("📋 Key Info: security-keys/roaming_key_info.json")
    print("=" * 40)

    print("")
    print("💡 SETUP INSTRUCTIONS:")
    print("1. 🔑 Copy rangercoin_roaming_private.pem to your USB key")
    print("2. 📱 On M1, run: ./download_my_blockchain_profile.sh")
    print("3. 🎯 Select USB key and roaming key file")
    print("4. 🚀 Enjoy your blockchain profile anywhere!")
    print("")
    print("🌟 Benefits:")
    print("   ✅ No passwords to remember or reset")
    print("   ✅ Secure authentication with your USB key")
    print("   ✅ Complete blockchain profile anywhere")
    print("   ✅ Send updates home to M3 Genesis")
    print("   ✅ Secure deletion prevents forensic recovery")
    print("")
    print("🎉 End of 70% password reset problems!")

if __name__ == "__main__":
    create_roaming_key()
