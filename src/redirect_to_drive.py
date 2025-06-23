import os
import numpy as np
from PIL import Image
import pymongo
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
import io

# === CONFIG ===
SERVICE_ACCOUNT_FILE = 'service_account.json'  # ← Service account JSON
INPUT_FOLDER_ID = '1eZENcdcZIZMP1eVWSzktQLhcKlSO-3mw'       # ← Google Drive input folder ID       https://drive.google.com/drive/folders/1Po3j-Rc3iPbmyft1Hnm48oKwXurH6XCU?usp=drive_link
OUTPUT_FOLDER_ID = '1oqWrapoHgyWUzdhjswWMbgSZwwmaaF9A'     # ← Google Drive output folder ID          https://drive.google.com/drive/folders/1oqWrapoHgyWUzdhjswWMbgSZwwmaaF9A?usp=drive_link

MONGO_URI = 'mongodb+srv://maishivamhoo:shivam123@cluster0.7sanbm8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
MONGO_DB = 'hackathon2'
MONGO_COLLECTION = 'images'

# === SETUP MONGODB ===
mongo_client = pymongo.MongoClient(MONGO_URI)
collection = mongo_client[MONGO_DB][MONGO_COLLECTION]

# === SETUP GOOGLE DRIVE API ===
SCOPES = ['https://www.googleapis.com/auth/drive']
creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
drive_service = build('drive', 'v3', credentials=creds)


from ultralytics import YOLO

# Load your trained model
model = YOLO(r"Our_Runs\train_3\best.pt")


# === FUNCTION TO DOWNLOAD IMAGE FROM DRIVE ===
def download_file(file_id, filename):
    request = drive_service.files().get_media(fileId=file_id)
    fh = io.FileIO(filename, 'wb')
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return filename

# === FUNCTION TO UPLOAD FILE TO DRIVE AND SHARE ===
def upload_file_to_drive(local_file, remote_name, folder_id):
    file_metadata = {
        'name': remote_name,
        'parents': [folder_id]
    }
    media = MediaFileUpload(local_file, resumable=True)
    uploaded_file = drive_service.files().create(body=file_metadata, media_body=media, fields='id').execute()

    # Make it public
    drive_service.permissions().create(
        fileId=uploaded_file['id'],
        body={'type': 'anyone', 'role': 'reader'}
    ).execute()

    # Return shareable link
    return f"https://drive.google.com/file/d/{uploaded_file['id']}/view?usp=sharing"

def predict_and_save_with_yolo(image_path, output_path):
    results = model.predict(source=image_path, save=False, save_txt=False, save_conf=False)

    # Extract first image with bounding boxes
    result = results[0]
    result.save(filename=output_path)  # Save annotated image directly


# === MAIN FUNCTION ===
def run_prediction_pipeline():
    # Step 1: List all files in INPUT_FOLDER_ID
    
    
    response = drive_service.files().list(
        q=f"'{INPUT_FOLDER_ID}' in parents and mimeType contains 'image/'",
        fields="files(id, name, createdTime)",
        orderBy="createdTime desc",
        pageSize=1
    ).execute()

    files = response.get('files', [])


    if not files:
        print("No images found in the input folder.")
        return

    for file in files:
        file_id = file['id']
        file_name = file['name']
        print(f"\nProcessing {file_name}...")

        local_input = f"input_{file_name}"
        download_file(file_id, local_input)

        # Step 2: Predict
        output_name = f"pred_{file_name}"  # define output name
        predict_and_save_with_yolo(local_input, output_name)


        # Step 3: Upload output to Drive and get link
        link = upload_file_to_drive(output_name, output_name, OUTPUT_FOLDER_ID)
        print(f"Uploaded result: {link}")

        # Step 4: Insert into MongoDB
        collection.insert_one({
            "input_file": file_name,
            "output_file": output_name,
            "output_link": link
        })
        print("MongoDB record inserted.")

        # Cleanup
        os.remove(local_input)
        os.remove(output_name)

if __name__ == "__main__":
    run_prediction_pipeline()
