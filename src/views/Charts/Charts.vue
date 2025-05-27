<template>
    <div id="chart" class="x-container" v-show="menuActiveIndex === 'charts'">
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ $t('view.charts.header') }}</span>
        </div>
        <keep-alive>
            <InstanceActivity
                v-if="menuActiveIndex === 'charts'"
                :dt-hour12="dtHour12"
                @open-previous-instance-info-dialog="$emit('open-previous-instance-info-dialog', $event)" />
            <el-backtop target="#chart" :right="30" :bottom="30"></el-backtop>
        </keep-alive>
    </div>
</template>

<script>
    import InstanceActivity from './components/InstanceActivity.vue';

    export default {
        name: 'ChartsTab',
        components: {
            InstanceActivity
        },
        props: {
            dtHour12: Boolean,
            menuActiveIndex: String
        }
    };
</script>
