/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1146066909",
    "max": 0,
    "min": 0,
    "name": "phone",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "select1466534506",
    "maxSelect": 0,
    "name": "role",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "",
      "customer",
      "admin"
    ]
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "bool3163732032",
    "name": "isBlocked",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3185998707",
    "max": 0,
    "min": 0,
    "name": "adminNotes",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "date86910522",
    "max": "",
    "min": "",
    "name": "lastLoginAt",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("text1146066909")

  // remove field
  collection.fields.removeById("select1466534506")

  // remove field
  collection.fields.removeById("bool3163732032")

  // remove field
  collection.fields.removeById("text3185998707")

  // remove field
  collection.fields.removeById("date86910522")

  return app.save(collection)
})
