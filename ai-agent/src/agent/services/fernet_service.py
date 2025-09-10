from cryptography.fernet import Fernet


class FernetService:
    fernet: Fernet

    def __init__(self, fernet: Fernet):
        self.fernet = fernet

    def encrypt_data(self, data: str) -> str:
        encrypted_bytes = self.fernet.encrypt(data.encode('utf-8'))
        return encrypted_bytes.decode('utf-8')

    def decrypt_data(self, data: str) -> str:
        encrypted_bytes = data.encode('utf-8')
        return self.fernet.decrypt(encrypted_bytes).decode('utf-8')