import { Client, Account, Functions } from 'appwrite';

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID'); // Replace 'YOUR_PROJECT_ID'

export const account = new Account(client);
export const functions = new Functions(client);

export default client;
