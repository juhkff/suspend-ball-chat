<template>
    <div id="app">
        <suspend-ball-chat />
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import SuspendBallChat from '../components/suspend-ball-chat/SuspendBallChat.vue';
@Component({
    name: 'App',
    components: {
        SuspendBallChat
    }
})
export default class App extends Vue {
}
</script>
<style scoped></style>