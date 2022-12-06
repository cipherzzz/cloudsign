// This is just a reference to keys deployed in the cloudformation template
const signers = [{
    name: "ECCSigningKey01",
    id: "b2489ec4-8484-4b63-b266-cb011354e65e"
},
{
    name: "ECCSigningKey02",
    id: "f51ed30e-618a-4240-9512-efe95204cc25"
},
{
    name: "ECCSigningKey03",
    id: "bd8f0ac0-0065-4255-a25c-a167f4f1c04c"
},
{
    name: "ECCSigningKey04",
    id: "6b129f3f-b493-4cfa-bef5-f8bfbaa47eca"
}
]

class LRU {
    constructor(options) {
        this.max = options.max
        this.cache = new Map()
        this.keys = []
        this.values = []
    }

    getNext() {
        const nextKey = this.keys[0]
        return this.get(nextKey)
    }

    get(key) {
        const item = this.cache.get(key)
        if (item) {
            this.keys = this.keys.filter(k => k !== key)
            this.keys.push(key)
            return item
        }
    }

    set(key, value) {
        if (this.cache.has(key)) {
            this.keys = this.keys.filter(k => k !== key)
            this.keys.push(key)
        } else {
            this.keys.push(key)
            this.cache.set(key, value)
            if (this.keys.length > this.max) {
                const oldestKey = this.keys.shift()
                this.cache.delete(oldestKey)
            }
        }
    }

    del(key) {
        this.keys = this.keys.filter(k => k !== key)
        this.cache.delete(key)
    }

    reset() {
        this.keys = []
        this.cache.clear()
    }

    get length() {
        return this.keys.length
    }

    keys() {
        return this.keys
    }

    values() {
        return this.keys.map(key => this.cache.get(key))
    }
}   // end of class LRU

function getLRU() {
    const lru = new LRU({
        max: 4
    })

    for (let i = 0; i < signers.length; i++) {
        const signer = signers[i]
        console.log(signer)
        lru.set(signer, signer)
    }

    return lru
}

const lruKeys = getLRU()

module.exports = {
    getNextKey: () => {
        const nextKey = lruKeys.getNext()
        return nextKey.id
    }
}


