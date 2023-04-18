import sha256 from 'crypto-js/sha256';

export class Crypt {
    static getSha256(message: string) {
        return sha256(message).toString();
    }
}
