<template>
    <div id="chart" class="x-container" v-show="menuActiveIndex === 'charts'">
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ $t('view.charts.header') }}</span>
        </div>
        <keep-alive>
            <InstanceActivity v-if="menuActiveIndex === 'charts'" />
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
            menuActiveIndex: String
        }
    };
</script>
