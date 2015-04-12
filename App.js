Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:[
	{
	    xtype: 'component',
	    itemId: 'notifier',
	    margin: 10
	},
        {
            xtype: 'container',
            itemId: 'boxContainer'
        },
        {
            xtype: 'container',
            itemId: 'gridContainer'
        }
	
    ],
    launch: function() {
        var filters = Ext.create('Rally.data.QueryFilter', {
                property: 'ElementName',
                operator: '=',
                value: 'Defect'
            });
            filters = filters.or({
                property: 'ElementName',
                operator: '=',
                value: 'HierarchicalRequirement'  
            });
            filters = filters.or({
                property: 'ElementName',
                operator: '=',
                value: 'TestCase'  
            });
            filters = filters.or({
                property: 'ElementName',
                operator: '=',
                value: 'Task'  
            });
	    filters = filters.or({
                property: 'ElementName',
                operator: '=',
                value: 'PortfolioItem'  
            });
            
        var typeDefCombobox = Ext.create('Rally.ui.combobox.ComboBox', {
                itemId: 'typeDefCombobox',
		fieldLabel: 'Select a Type',
		margin: 10,
		width: 300,
                storeConfig: {
                    autoLoad: true,
                    model: 'TypeDefinition',
                    fetch: ['Attributes','ElementName'],
                    valueField: 'ElementName',  
                    filters:[filters],
                    limit: Infinity,
		    context: {
			workspace: this.getContext().getWorkspaceRef()
		    }
                },
                listeners:{
                    ready: function(combobox){
                        this._loadCustomFields(combobox.getRecord());
                    },
                    select: function(combobox){
                        this._loadCustomFields(combobox.getRecord());
                    },
                    scope: this
   		}
            });
            this.down('#boxContainer').add(typeDefCombobox);
    },
    _loadCustomFields:function(record){
        var that = this;
        var attributes = record.getCollection('Attributes');
        console.log('attributes',attributes);
        var count = attributes.getCount();
        var pendingAttributes = count;
        var fieldsArray = [];
        attributes.load({
            fetch:['ElementName','Custom','AttributeType'],
            callback: function(fields, operation, success){
                _.each(fields, function(field){
                    if (field.get('Custom') === true && field.get('AttributeType') !== 'STRING') {
                        fieldsArray.push({'name':field.get('ElementName'),'type':field.get('AttributeType'),'allowedvalues':'n/a'});
                        pendingAttributes--;
                        if (pendingAttributes === 0) {
                            that._makeGrid(fieldsArray);
                        }
                    }
                    else if(field.get('Custom') === true && field.get('AttributeType') === 'STRING'){
                        var allowed = field.getCollection('AllowedValues');
                        allowed.load({
                            fetch:['StringValue'],
                            callback: function(values, operation, success){
                                var allowedValues = [];
				var countOfValues = values.length;
                                _.each(values, function(value){
				    countOfValues--;
				    if (value.get('StringValue') !== '') { //remove empty value
					allowedValues.push(value.get('StringValue'));
				    }
				    if (countOfValues === 0) {
					allowedValues = allowedValues.join(',');
				    }
                                });
                                fieldsArray.push({'name':field.get('ElementName'),'type':field.get('AttributeType'),'allowedvalues':allowedValues});
                                pendingAttributes--;
                                if (pendingAttributes === 0) {
                                    that._makeGrid(fieldsArray);
                                }
                            }
                        });
                    }
                    else {
                        pendingAttributes--;
                        if (pendingAttributes === 0) {
                            that._makeGrid(fieldsArray);
                        }
			
                    }
                }); 
            }
        });
    },
    _makeGrid:function(fields){
	if (this.down('rallygrid')) {
            Ext.ComponentQuery.query('#gridContainer')[0].remove(Ext.ComponentQuery.query('#attributeGrid')[0], true);
        }
        console.log("makegrid fields", fields);
	var count = fields.length;
        if (count>0) {
	    Ext.ComponentQuery.query('#notifier')[0].update(count + ' custom fields found');
            var store = Ext.create('Rally.data.custom.Store', {
                fields: ['name','type','allowedvalues'],
                data: fields
            });
            console.log("store:", store);
	    
         this.down('#gridContainer').add({
            xtype: 'rallygrid',
            itemId: 'attributeGrid',
            store: store,
            enableEditing: false,
            showRowActionsColumn: false,
	    width: 700,
            columnCfgs: [
                {text: 'Name', dataIndex: 'name',flex:1},
                {text: 'Type', dataIndex: 'type'},
                {text: 'Allowed Values', dataIndex: 'allowedvalues',flex:1}
            ]
        });
        }
	else{
	    Ext.ComponentQuery.query('#notifier')[0].update('no custom fields found');
	}
        

        
    }
});