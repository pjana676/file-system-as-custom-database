const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const databaseName = 'myDatabase';
const databaseFolderPath = path.join(__dirname, databaseName)

class CollectionService {
    constructor(collectionName) {
        this.databaseName = databaseName;
        this.collectionName = collectionName;
        this.collectionFolderPath = path.join(databaseFolderPath, this.collectionName);

        this.ensureFolderPath(databaseFolderPath);
        this.ensureFolderPath(this.collectionFolderPath);

        this.collection = this.loadCollection();
    }

    ensureFolderPath(folderPath) {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
            console.log(`Created folder: ${folderPath}`);
        }
    }

    loadCollection() {
        const collectionFilePath = path.join(this.collectionFolderPath, `${this.collectionName}.json`);
        
        try {
            if (!fs.existsSync(collectionFilePath)) {
                fs.writeFileSync(collectionFilePath, JSON.stringify([], null, 2));
                console.log(`Created empty ${this.collectionName} collection file.`);
            }

            const fileData = fs.readFileSync(collectionFilePath, 'utf8');
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

        this.collection.push({ 'id': id, 'file-name': filename });
        this.saveCollection();

        console.log(`Reference created with ID: ${id}`);

        return referenceData;
    }

    getReference(_id) {
        const reference = this.collection.find(item => item['id'] === _id);
        return reference ? this.loadCollectionFile(reference['file-name']) : null;
    }

    updateReference(_id, reference) {
        const referenceData = this.collection.find(item => item['id'] === _id);

        if (referenceData) {
            const filename = referenceData['file-name'];
            const filePath = path.join(this.collectionFolderPath, filename);
            const existingData = this.getReference(_id)
            fs.writeFileSync(filePath, JSON.stringify({ ...existingData, ...reference }, null, 2));
            console.log(`Reference updated for ID: ${_id}`);
        } else {
            console.log(`No reference found for ID: ${_id}`);
        }
    }

    getAllDocs() {
        const _docs = this.collection.map(item => {
            const filename = item['file-name'];
            return this.loadCollectionFile(filename);
        });

        return _docs.filter(doc => doc !== null);
    }

    deleteReference(_id) {
        const referenceData = this.collection.find(item => item['id'] === _id);

        if (referenceData) {
            const filename = referenceData['file-name'];
            const filePath = path.join(this.collectionFolderPath, filename);
            fs.unlinkSync(filePath);

            const index = this.collection.findIndex(item => item['id'] === _id);
            this.collection.splice(index, 1);
            this.saveCollection();

            console.log(`Reference deleted for ID: ${_id}`);
        } else {
            console.log(`No reference found for ID: ${_id}`);
        }
    }

    loadCollectionFile(filename) {
        try {
            const filePath = path.join(this.collectionFolderPath, filename);
            const fileData = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileData);
        } catch (error) {
            console.error(`Failed to load collection file: ${filename}`, error);
            return null;
        }
    }
}
module.exports = CollectionService
