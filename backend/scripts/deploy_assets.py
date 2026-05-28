import subprocess
import os

files_to_scp = [
    # Source path (local), Destination path (remote relative to /home/ubuntu/highlawmain)
    ("frontend/frontend/src/pages/home/homeTokens.js", "frontend/frontend/src/pages/home/homeTokens.js"),
    ("frontend/frontend/public/lawyers/kangmingu.jpg", "frontend/frontend/public/lawyers/kangmingu.jpg"),
    ("frontend/frontend/public/lawyers/kimbeom.jpg", "frontend/frontend/public/lawyers/kimbeom.jpg"),
    ("frontend/frontend/public/lawyers/jodeokjae.jpg", "frontend/frontend/public/lawyers/jodeokjae.jpg"),
    ("frontend/frontend/public/lawyers/kang-min-gu/kang-min-gu_profile.jpg", "frontend/frontend/public/lawyers/kang-min-gu/kang-min-gu_profile.jpg"),
    ("frontend/frontend/public/lawyers/kim-beom/kim-beom_profile.jpg", "frontend/frontend/public/lawyers/kim-beom/kim-beom_profile.jpg"),
    ("frontend/frontend/public/lawyers/jo-deok-jae/jo-deok-jae_profile.jpg", "frontend/frontend/public/lawyers/jo-deok-jae/jo-deok-jae_profile.jpg")
]

base_local_dir = r"c:\Users\mingu\OneDrive\문서\Highlaw Homepage\highlawmain\highlaw"
remote_base_dir = "/home/ubuntu/highlawmain"

print("Starting asset deployment via SCP...")

for local_rel, remote_rel in files_to_scp:
    local_path = os.path.join(base_local_dir, local_rel)
    remote_path = f"{remote_base_dir}/{remote_rel}"
    
    # Ensure remote directory exists by running ssh mkdir -p
    remote_dir = os.path.dirname(remote_path)
    print(f"Creating remote directory if not exists: {remote_dir}")
    subprocess.run(["ssh", "highlaw", f"mkdir -p {remote_dir}"], check=True)
    
    # Copy file via scp
    print(f"Copying {local_rel} -> highlaw:{remote_rel}")
    subprocess.run(["scp", local_path, f"highlaw:{remote_path}"], check=True)

print("All assets successfully deployed via SCP!")
