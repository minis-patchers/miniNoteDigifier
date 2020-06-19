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
            let forms = xelib.GetRecords(filen, "FLST")
            forms.forEach(form => {
                helpers.logMessage(xelib.LongName(form))
                if(xelib.LongName(form).contains("VNotes")) {
                    locals.noteMSG = helpers.copyToPatch(form)
                    xelib.RemoveElement(locals.noteMSG, "FormIDs")
                    
                } else if(xelib.LongName(form).contains("MiscNotes")) {
                    locals.miscNotes = helpers.copyToPatch(form)
                    xelib.RemoveElement(locals.miscNotes, "FormIDs")
                } else {
                    locals.noteBools = helpers.copyToPatch(form)
                    xelib.RemoveElement(locals.noteBools, "FormIDs")
                }
            })
            if(settings.UseRCU) {
                xelib.GetRecords(filen, "BOOK").forEach(form => {
                    if(xelib.GetValue(form, "EDID") == "SSWB_ExampleNote") {
                        xelib.AddFormID(locals.miscNotes, xelib.GetHexFormID(form))
                        return;
                    }
                })
                xelib.GetRecords(filen, "GLOB").forEach(form => {
                    if(xelib.GetValue(form, "EDID") == "PlayerHasNote00") {
                        xelib.AddFormID(locals.noteBools, xelib.GetHexFormID(form))
                        return;
                    }
                })
                xelib.GetRecords(filen, "MESG").forEach(form => {
                    if(xelib.GetValue(form, "EDID") == "SSWB_Note02") {
                        xelib.AddFormID(locals.noteMSG, xelib.GetHexFormID(form))
                        return;
                    }
                })
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
                    inf = inf.replace(/<font face='.*>/, "")
                    inf = inf.replace(/<font face='.* size='\d+'>/, "")
                    inf = inf.replace(/<p align='.*'>/, "")
                    inf = inf.replace(/<font size='\d+'>/, "")
                    inf = inf.replace("</font>" ,"")
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