scp -o StrictHostKeyChecking=no -i "..\ssh-key-2026-01-06.key" -r ".\.next\standalone\.next" ubuntu@158.178.226.84:~/tindahan-prod/
scp -o StrictHostKeyChecking=no -i "..\ssh-key-2026-01-06.key" -r ".\.next\static" ubuntu@158.178.226.84:~/tindahan-prod/.next/
scp -o StrictHostKeyChecking=no -i "..\ssh-key-2026-01-06.key" ".\.next\standalone\server.js" ubuntu@158.178.226.84:~/tindahan-prod/
ssh -o StrictHostKeyChecking=no -i "..\ssh-key-2026-01-06.key" ubuntu@158.178.226.84 "pm2 restart tindahanpos-prod"
