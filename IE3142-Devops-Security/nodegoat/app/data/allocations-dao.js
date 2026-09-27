const UserDAO = require("./user-dao").UserDAO;

function AllocationsDAO(db) {
    "use strict";

    if (false === (this instanceof AllocationsDAO)) {
        return new AllocationsDAO(db);
    }

    const allocationsCol = db.collection("allocations");
    const userDAO = new UserDAO(db);

    this.update = (userId, stocks, funds, bonds, callback) => {
        const parsedUserId = parseInt(userId, 10);
        allocationsCol.update(
            { userId: parsedUserId },
            { $set: { stocks, funds, bonds } },
            { upsert: true },
            err => {
                if (err) return callback(err, null);
                console.log("Updated allocations");
                return callback(null, true);
            }
        );
    };

    this.getByUserIdAndThreshold = (userId, threshold, callback) => {
        const parsedUserId = parseInt(userId, 10);

        const searchCriteria = () => {
            if (threshold) {
                const parsedThreshold = parseInt(threshold, 10);
                return {
                    userId: parsedUserId,
                    stocks: { $gt: isNaN(parsedThreshold) ? 0 : parsedThreshold }
                };
            }
            return { userId: parsedUserId };
        };

        allocationsCol.find(searchCriteria()).toArray((err, allocations) => {
            if (err) return callback(err, null);
            if (!allocations.length) return callback("ERROR: No allocations found for the user", null);

            let doneCounter = 0;
            const userAllocations = [];

            allocations.forEach(alloc => {
                userDAO.getUserById(alloc.userId, (err, user) => {
                    if (err) return callback(err, null);

                    alloc.userName = user.userName;
                    alloc.firstName = user.firstName;
                    alloc.lastName = user.lastName;

                    doneCounter += 1;
                    userAllocations.push(alloc);

                    if (doneCounter === allocations.length) {
                        callback(null, userAllocations);
                    }
                });
            });
        });
    };
}

module.exports.AllocationsDAO = AllocationsDAO;
