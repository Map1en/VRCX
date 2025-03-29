const groupReq = {
    /**
     *
     * @param {string} groupId
     * @param {{isRepresenting: bool}} params
     * @returns
     */
    setGroupRepresentation(groupId, params) {
        return window.API.call(`groups/${groupId}/representation`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                groupId,
                params
            };
            window.API.$emit('GROUP:SETREPRESENTATION', args);
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    cancelGroupRequest(params) {
        return window.API.call(`groups/${params.groupId}/requests`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('GROUP:CANCELJOINREQUEST', args);
            return args;
        });
    }
};

export default groupReq;
