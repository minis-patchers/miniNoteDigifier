/* global ngapp, xelib */

registerPatcher({
    info: info,
    gameModes: [xelib.gmFO4],
    settings: {
        label: 'Note Digifier',
        hide: true,
        defaultSettings: {
            UseRCU: true
        }
    },
    // optional array of required filenames.  can omit if empty.
    requiredFiles: function() {
        return ["PBT_RoN.esp"]
    },
    getFilesToPatch: function(filenames) {
        return filenames;
    },
    execute: (patch, helpers, settings, locals) => ({
        initialize: function(patch, helpers, settings, locals) {
            let filen = xelib.FileByName("PBT_RoN.esp")
            locals.number = 0
            locals.noteMSG = helpers.copyToPatch(xelib.GetElement(filen, "FLST\\SSWB_VNotes"))
            xelib.RemoveElement(locals.noteMSG, "FormIDs")
            locals.miscNotes = helpers.copyToPatch(xelib.GetElement(filen, "FLST\\SSWB_MiscNotes"))
            xelib.RemoveElement(locals.miscNotes, "FormIDs")
            locals.noteBools = helpers.copyToPatch(xelib.GetElement(filen, "FLST\\SSWB_GlobalValues"))
            xelib.RemoveElement(locals.noteBools, "FormIDs")
            if(settings.UseRCU) {
                xelib.AddFormID(locals.noteBools, xelib.GetHexFormID(xelib.GetElement(filen, "GLOB\\PlayerHasNote00")))
                xelib.AddFormID(locals.miscNotes, xelib.GetHexFormID(xelib.GetElement(filen, "BOOK\\SSWB_ExampleNote")))
                xelib.AddFormID(locals.noteMSG, xelib.GetHexFormID(xelib.GetElement(filen, "MESG\\SSWB_Note02")))
            }
        },
        // required: array of process blocks. each process block should have both
        // a load and a patch function.
        process: [{
            load: {
                signature: "BOOK",
                filter: function(record) {
                    return xelib.GetValue(record, "INAM").contains("DONOTUSE_InventoryNote") && !xelib.GetValue(record, "FULL").contains("|Password|") && !xelib.GetValue(record, "EDID").contains("SSWB_ExampleNote")
                }
            },
            patch: function(record, helpers, settings, locals) {
                if(!xelib.GetValue(record, "DESC").contains("<Alias=")) {
                    let mesg = xelib.AddElement(patch, "MESG\\MESG")
                    xelib.AddElement(mesg, "FULL")
                    xelib.AddElement(mesg, "EDID")
                    helpers.cacheRecord(mesg, "DIGI_"+locals.number)
                    let inf = xelib.GetValue(record, "DESC")
                    inf = inf.replace(/<.*\/?>/, "")
                    xelib.SetValue(mesg, "DESC", inf)
                    if(xelib.HasElement(record, "FULL")) {
                        xelib.SetValue(mesg, "FULL", xelib.GetValue(record, "FULL"))
                    }
                    xelib.SetValue(mesg, "EDID", "DIGI_"+xelib.GetValue(record, "EDID")+locals.number)
                    let bool = xelib.AddElement(patch,"GLOB\\GLOB")
                    xelib.AddElement(bool, "EDID")
                    helpers.cacheRecord(bool, "BOOL_"+locals.number)
                    xelib.SetValue(bool, "FNAM", "Boolean")
                    xelib.SetValue(bool, "EDID", "BOOL_"+xelib.GetValue(record, "EDID")+locals.number)
                    xelib.AddFormID(locals.miscNotes, xelib.GetHexFormID(record))
                    xelib.AddFormID(locals.noteMSG, xelib.GetHexFormID(mesg))
                    xelib.AddFormID(locals.noteBools, xelib.GetHexFormID(bool))
                    locals.number++
                }
            }
        }],
        finalize: function(patchFile, helpers, settings, locals) {
            helpers.logMessage("Digified "+locals.number + " books")
        }
    })
});