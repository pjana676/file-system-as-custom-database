const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const databaseName = 'myDatabase';
const databaseFolderPath = path.join(__dirname, databaseName)

class UserMasterService {
    constructor(collectionName) {
        this.databaseName = databaseName;
        this.collectionName = collectionName;
        this.collection = this.loadCollection();
        this.collectionFolderPath = path.join(databaseFolderPath, this.collectionName);

        this.ensureFolderPath(databaseFolderPath);
        this.ensureFolderPath(this.collectionFolderPath);
    }

    ensureFolderPath(folderPath) {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
            console.log(`Created folder: ${folderPath}`);
        }
    }

    loadCollection() {
        const filePath = path.join(databaseFolderPath, `${this.collectionName}.json`);

        try {
            const fileData = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileData);
        } catch (error) {
            console.error(`Failed to load ${this.collectionName} collection:`, error);
            return [];
        }
    }

    saveCollection() {
        const filePath = path.join(databaseFolderPath, `${this.collectionName}.json`);

        try {
            fs.writeFileSync(filePath, JSON.stringify(this.collection, null, 2));
            console.log(`${this.collectionName} collection saved successfully.`);
        } catch (error) {
            console.error(`Failed to save ${this.collectionName} collection:`, error);
        }
    }

    generateId() {
        const hash = crypto.createHash('sha256');
        hash.update(new Date().getTime().toString());
        return hash.digest('hex');
    }

    createReference(reference) {
        const id = this.generateId();
        const filename = `${id}.json`;
        const filePath = path.join(this.collectionFolderPath, filename);
        const referenceData = {
            _id: id,
            ...reference
        };

        fs.writeFileSync(filePath, JSON.stringify(referenceData, null, 2));

        this.collection.push({ 'user-id': id, 'file-name': filename });
        this.saveCollection();

        console.log(`Reference created with ID: ${id}`);

        return referenceData;
    }

    getReference(userId) {
        const reference = this.collection.find(item => item['user-id'] === userId);
        return reference ? this.loadUserFile(reference['file-name']) : null;
    }

    updateReference(userId, reference) {
        const referenceData = this.collection.find(item => item['user-id'] === userId);

        if (referenceData) {
            const filename = referenceData['file-name'];
            const filePath = path.join(this.collectionFolderPath, filename);
            const existingData = this.getReference(userId)
            fs.writeFileSync(filePath, JSON.stringify({...existingData, ...reference}, null, 2));
            console.log(`Reference updated for user ID: ${userId}`);
        } else {
            console.log(`No reference found for user ID: ${userId}`);
        }
    }

    getAllUsers() {
        const users = this.collection.map(item => {
            const filename = item['file-name'];
            return this.loadUserFile(filename);
        });

        return users.filter(user => user !== null);
    }

    deleteReference(userId) {
        const referenceData = this.collection.find(item => item['user-id'] === userId);

        if (referenceData) {
            const filename = referenceData['file-name'];
            const filePath = path.join(this.collectionFolderPath, filename);
            fs.unlinkSync(filePath);

            const index = this.collection.findIndex(item => item['user-id'] === userId);
            this.collection.splice(index, 1);
            this.saveCollection();

            console.log(`Reference deleted for user ID: ${userId}`);
        } else {
            console.log(`No reference found for user ID: ${userId}`);
        }
    }

    loadUserFile(filename) {
        try {
            const filePath = path.join(this.collectionFolderPath, filename);
            const fileData = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileData);
        } catch (error) {
            console.error(`Failed to load user file: ${filename}`, error);
            return null;
        }
    }
}
module.exports = UserMasterService
